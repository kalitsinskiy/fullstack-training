import { Module } from '@nestjs/common';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { InternalController } from './internal.controller';
import { ServiceKeyGuard } from './service-key.guard';

@Module({
  imports: [UsersModule, RoomsModule],
  controllers: [InternalController],
  providers: [ServiceKeyGuard],
})
export class InternalModule {}
