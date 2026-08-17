import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';

export const RABBITMQ_URL = 'RABBITMQ_URL';

const EXCHANGE = 'santa.events';
const RECONNECT_DELAY_MS = 5000;

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private destroyed = false;

  constructor(@Inject(RABBITMQ_URL) private readonly rabbitmqUrl: string) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.destroyed) return;
    try {
      const conn = await amqp.connect(this.rabbitmqUrl);
      conn.on('error', (err) =>
        this.logger.error('RabbitMQ connection error', err),
      );
      conn.on('close', () => {
        this.channel = null;
        this.connection = null;
        if (!this.destroyed) {
          this.logger.warn(
            `RabbitMQ connection closed, reconnecting in ${RECONNECT_DELAY_MS}ms…`,
          );
          setTimeout(() => void this.connect(), RECONNECT_DELAY_MS);
        }
      });
      this.connection = conn;
      this.channel = await conn.createChannel();
      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      this.logger.log(`Connected to RabbitMQ, exchange "${EXCHANGE}" ready`);
    } catch (err) {
      this.logger.error('RabbitMQ connect failed, retrying…', err);
      if (!this.destroyed) {
        setTimeout(() => void this.connect(), RECONNECT_DELAY_MS);
      }
    }
  }

  publish(routingKey: string, data: object): void {
    if (!this.channel) {
      this.logger.warn(
        `Cannot publish ${routingKey}: no channel (broker unavailable)`,
      );
      return;
    }
    try {
      this.channel.publish(
        EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
          messageId: randomUUID(),
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );
    } catch (err) {
      this.logger.error(`Failed to publish ${routingKey}`, err);
    }
  }

  async onModuleDestroy() {
    this.destroyed = true;
    await this.channel?.close();
    await this.connection?.close();
  }
}
