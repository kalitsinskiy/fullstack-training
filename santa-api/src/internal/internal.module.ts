import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { ServiceKeyGuard } from './guards/service-key.guard';

@Module({
  imports: [UsersModule, RoomsModule],
  controllers: [InternalController],
  providers: [ServiceKeyGuard],
})
export class InternalModule {}
