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

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export class AmqpEventTransport implements EventTransport {
  private connection!: ChannelModel;
  private channel!: Channel;
  private closing = false;
  private reconnectAttempt = 0;

  private constructor(
    private readonly url: string,
    private readonly logger?: Logger,
  ) {}

  static async create(
    url: string,
    logger?: Logger,
  ): Promise<AmqpEventTransport> {
    const transport = new AmqpEventTransport(url, logger);
    await transport.connect();
    return transport;
  }

  private async connect(): Promise<void> {
    const connection = await connect(this.url);
    const channel = await connection.createChannel();
    await channel.assertExchange(SANTA_EVENTS_EXCHANGE, 'topic', {
      durable: true,
    });

    connection.on('error', (error: Error) => {
      this.logger?.error(`RabbitMQ connection error: ${error.message}`);
    });
    connection.on('close', () => {
      if (this.closing) return;
      this.logger?.warn('RabbitMQ connection closed — reconnecting');
      this.scheduleReconnect();
    });
    channel.on('error', (error: Error) => {
      this.logger?.error(`RabbitMQ channel error: ${error.message}`);
    });

    this.connection = connection;
    this.channel = channel;
    this.reconnectAttempt = 0;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt += 1;
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempt - 1),
    );
    setTimeout(() => {
      if (this.closing) return;
      this.connect().catch((error: Error) => {
        this.logger?.error(`RabbitMQ reconnect failed: ${error.message}`);
        this.scheduleReconnect();
      });
    }, delay);
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
    this.closing = true;
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

  const transport = await AmqpEventTransport.create(url, logger);
  logger.log(`Connected to RabbitMQ (${url.replace(/\/\/.*@/, '//***@')})`);
  return transport;
}
