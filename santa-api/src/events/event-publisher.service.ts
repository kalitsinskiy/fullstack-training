import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as amqp from 'amqplib';

const EXCHANGE = 'santa.events';
const RECONNECT_MAX_DELAY_MS = 30_000;

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private closing = false;
  private attempt = 0;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    let connection: amqp.ChannelModel | undefined;

    try {
      connection = await amqp.connect(
        this.config.getOrThrow<string>('RABBITMQ_URL'),
      );

      connection.on('error', (err: Error) =>
        this.logger.error(`RabbitMQ connection error: ${err.message}`),
      );

      connection.on('close', () => {
        if (this.connection !== connection) return;

        this.connection = undefined;
        this.channel = undefined;

        if (this.closing) return;

        this.logger.warn('RabbitMQ connection closed — reconnecting');

        this.scheduleReconnect();
      });

      const channel = await connection.createChannel();

      channel.on('error', (err: Error) =>
        this.logger.error(`RabbitMQ channel error: ${err.message}`),
      );

      channel.on('close', () => {
        if (this.channel !== channel) return;

        this.channel = undefined;

        if (this.closing) return;

        this.logger.warn('RabbitMQ channel closed — recycling connection');

        void this.closeQuietly(this.connection);
      });

      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

      this.connection = connection;
      this.channel = channel;
      this.attempt = 0;

      this.logger.log(`Connected to RabbitMQ; asserted exchange "${EXCHANGE}"`);
    } catch (err) {
      this.logger.error(
        `RabbitMQ connect failed (attempt ${this.attempt + 1}): ${(err as Error).message}`,
      );

      await this.closeQuietly(connection);

      if (!this.closing) this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.closing) return;

    const delay = Math.min(RECONNECT_MAX_DELAY_MS, 1000 * 2 ** this.attempt++);

    this.logger.warn(`Retrying RabbitMQ connection in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, delay);

    this.reconnectTimer.unref();
  }

  private async closeQuietly(closeable?: {
    close: () => Promise<void>;
  }): Promise<void> {
    await closeable?.close();
  }

  publish(routingKey: string, data: Record<string, unknown>): void {
    if (!this.channel) {
      this.logger.warn(
        `Skipped publishing "${routingKey} - no RabbitMQ channel"`,
      );

      return;
    }

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

    this.logger.debug(`Published "${routingKey}"`);
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    await this.closeQuietly(this.channel);
    await this.closeQuietly(this.connection);
  }
}
