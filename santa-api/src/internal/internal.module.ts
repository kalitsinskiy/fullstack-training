import { Module } from '@nestjs/common';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [UsersModule, RoomsModule],
  controllers: [InternalController],
  providers: [ServiceKeyGuard],
})
export class InternalModule {}
