import { randomUUID } from 'node:crypto';
import { connect, type ChannelModel, type Channel } from 'amqplib';
import type { Logger } from '@nestjs/common';

export const SANTA_EVENTS_EXCHANGE = 'santa.events';

export const EVENT_KEYS = {
  roomCreated: 'room.created',
  userJoined: 'user.joined',
  drawCompleted: 'draw.completed',
  wishlistUpdated: 'wishlist.updated',
} as const;

export type EventKey = (typeof EVENT_KEYS)[keyof typeof EVENT_KEYS];

export interface PublishedEvent {
  routingKey: string;
  payload: Record<string, unknown>;
  messageId: string;
}

export interface EventTransport {
  publish(event: PublishedEvent): Promise<void>;
  close(): Promise<void>;
}

export class AmqpEventTransport implements EventTransport {
  private constructor(
    private readonly connection: ChannelModel,
    private readonly channel: Channel,
  ) {}

  static async create(url: string): Promise<AmqpEventTransport> {
    const connection = await connect(url);
    const channel = await connection.createChannel();
    await channel.assertExchange(SANTA_EVENTS_EXCHANGE, 'topic', {
      durable: true,
    });
    return new AmqpEventTransport(connection, channel);
  }

  publish(event: PublishedEvent): Promise<void> {
    this.channel.publish(
      SANTA_EVENTS_EXCHANGE,
      event.routingKey,
      Buffer.from(JSON.stringify(event.payload)),
      {
        persistent: true,
        messageId: event.messageId,
        contentType: 'application/json',
        timestamp: Date.now(),
      },
    );
    return Promise.resolve();
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }
}

export class RecordingEventTransport implements EventTransport {
  readonly events: PublishedEvent[] = [];

  publish(event: PublishedEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.events.length = 0;
    return Promise.resolve();
  }
}

export function newMessageId(): string {
  return randomUUID();
}

export async function createEventTransport(
  url: string,
  isTest: boolean,
  logger: Logger,
): Promise<EventTransport> {
  if (isTest) {
    logger.log('NODE_ENV=test — recording events in memory');
    return new RecordingEventTransport();
  }

  const transport = await AmqpEventTransport.create(url);
  logger.log(`Connected to RabbitMQ (${url.replace(/\/\/.*@/, '//***@')})`);
  return transport;
}
