import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPublisherService, RABBITMQ_URL } from './event-publisher.service';

@Module({
  providers: [
    {
      provide: RABBITMQ_URL,
      useFactory: (config: ConfigService) =>
        config.get<string>('RABBITMQ_URL')!,
      inject: [ConfigService],
    },
    EventPublisherService,
  ],
  exports: [EventPublisherService],
})
export class EventsModule {}
