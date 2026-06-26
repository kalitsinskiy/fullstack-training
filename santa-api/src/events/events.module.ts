import { Global, Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';

// Global so any feature service can inject EventPublisherService to emit events.
@Global()
@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
