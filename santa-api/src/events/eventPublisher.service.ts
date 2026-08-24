import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import amqp from 'amqplib';
import { RoutingKey } from './routingKey';

const EXCHANGE = 'santa.events';
const RECONNECT_BASE_DELAY = 1000; // 1s
const RECONNECT_MAX_DELAY = 30_000; // 30s

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private url?: string;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private shuttingDown = false;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(EventPublisherService.name);
  }

  async onModuleInit() {
    this.url = process.env.RABBITMQ_URL;

    if (!this.url) {
      // Not configured (e.g. tests / local dev). Publishing becomes a no-op,
      // but make it loud so a missing broker in prod is obvious.
      this.logger.warn(
        'RABBITMQ_URL is not set — event publishing is disabled',
      );
      return;
    }

    await this.connect();
  }

  private async connect(): Promise<void> {
    if (!this.url || this.shuttingDown) {
      return;
    }

    try {
      const connection = await amqp.connect(this.url);
      const channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

      // Listen for failures so an unhandled 'error' event can't take down the
      // process, and so a dropped connection triggers a reconnect.
      connection.on('error', (err) =>
        this.logger.error({ err }, 'RabbitMQ connection error'),
      );
      connection.on('close', () => {
        this.connection = undefined;
        this.channel = undefined;
        this.scheduleReconnect();
      });

      this.connection = connection;
      this.channel = channel;
      this.reconnectAttempts = 0;
      this.logger.info('Connected to RabbitMQ');
    } catch (err) {
      this.logger.error({ err: err as Error }, 'Failed to connect to RabbitMQ');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.shuttingDown || this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_DELAY * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_DELAY,
    );
    this.reconnectAttempts++;
    this.logger.warn(
      { delay, attempt: this.reconnectAttempts },
      'Reconnecting to RabbitMQ',
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, delay);
  }

  publish(routingKey: RoutingKey, data: object): void {
    // Events are best-effort: a broker outage must never fail the request whose
    // Mongo write has already committed. Log and move on.
    if (!this.channel) {
      return;
    }

    try {
      this.channel.publish(
        EXCHANGE,
        routingKey.toString(),
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
          messageId: randomUUID(),
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );
    } catch (err) {
      this.logger.error(
        { err: err as Error, routingKey: routingKey.toString() },
        'Failed to publish event',
      );
    }
  }

  async onModuleDestroy() {
    this.shuttingDown = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
