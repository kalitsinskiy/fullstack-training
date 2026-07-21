import { Module } from '@nestjs/common';
import { EventPublisherService } from './eventPublisher.service';

@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
