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

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await amqp.connect(
        this.config.getOrThrow<string>('RABBITMQ_URL'),
      );
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });

      this.logger.log(`Connected to RabbitMQ; asserted exchange "${EXCHANGE}"`);
      this.connection.on('error', (err) =>
        this.logger.error(`RabbitMQ connection error: ${err.message}`),
      );
    } catch (err) {
      this.logger.error(
        `RabbitMQ unavailable at startup: ${(err as Error).message}`,
      );
    }
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
    await this.channel?.close();
    await this.connection?.close();
  }
}
