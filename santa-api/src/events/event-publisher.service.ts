import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as amqp from 'amqplib';

export const SANTA_EXCHANGE = 'santa.events';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection?: Awaited<ReturnType<typeof amqp.connect>>;
  private channel?: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Skip the broker in tests — publishing is fire-and-forget infra.
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    try {
      this.connection = await amqp.connect(
        this.config.getOrThrow<string>('RABBITMQ_URL'),
      );
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(SANTA_EXCHANGE, 'topic', {
        durable: true,
      });
      this.logger.log('RabbitMQ publisher connected');
    } catch (err) {
      // Don't crash the app if the broker is momentarily unavailable.
      this.logger.error(
        `RabbitMQ publisher connect failed: ${(err as Error).message}`,
      );
    }
  }

  /** Publish a domain event to the santa.events topic exchange. */
  publish(routingKey: string, data: object): void {
    if (!this.channel) {
      this.logger.warn(`No channel — dropping event "${routingKey}"`);
      return;
    }
    this.channel.publish(
      SANTA_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: randomUUID(),
        contentType: 'application/json',
        timestamp: Date.now(),
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
