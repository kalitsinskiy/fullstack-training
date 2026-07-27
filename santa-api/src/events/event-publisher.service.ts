import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createEventTransport,
  newMessageId,
  RecordingEventTransport,
  type EventKey,
  type EventTransport,
  type PublishedEvent,
} from './event-transport';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private transport: EventTransport = new RecordingEventTransport();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');

    try {
      this.transport = await createEventTransport(url, isTest, this.logger);
    } catch (error) {
      this.logger.error(
        `Could not connect to RabbitMQ: ${(error as Error).message}. Events will be dropped.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.transport.close();
    } catch (error) {
      this.logger.warn(
        `Error closing RabbitMQ connection: ${(error as Error).message}`,
      );
    }
  }

  async publish(
    routingKey: EventKey,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: PublishedEvent = {
      routingKey,
      payload,
      messageId: newMessageId(),
    };

    try {
      await this.transport.publish(event);
      this.logger.debug(`Published ${routingKey} (${event.messageId})`);
    } catch (error) {
      this.logger.error(
        `Failed to publish ${routingKey}: ${(error as Error).message}`,
      );
    }
  }

  get recordedEvents(): readonly PublishedEvent[] {
    return this.transport instanceof RecordingEventTransport
      ? this.transport.events
      : [];
  }
}
