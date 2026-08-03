import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';

const EXCHANGE = 'santa.events';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    const url = this.config.get<string>('RABBITMQ_URL')!;
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    this.logger.log(`Connected to RabbitMQ, exchange "${EXCHANGE}" ready`);
  }

  publish(routingKey: string, data: object): void {
    if (!this.channel) return;
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
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
