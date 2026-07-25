import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import amqp from 'amqplib';
import { RoutingKey } from './routingKey';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private configured: boolean = false;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL;

    if (!url) {
      return;
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('santa.events', 'topic', {
      durable: true,
    });

    this.configured = true;
  }

  publish(routingKey: RoutingKey, data: object): void {
    if (!this.configured) return;

    this.channel.publish(
      'santa.events',
      routingKey.toString(),
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
    if (!this.configured) return;
    await this.channel?.close();
    await this.connection?.close();

    this.configured = false;
  }
}
