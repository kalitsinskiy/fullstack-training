import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { InternalController } from './internal.controller';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [InternalController],
  providers: [ServiceKeyGuard],
})
export class InternalModule {}
