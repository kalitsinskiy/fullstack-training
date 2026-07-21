import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InternalController } from './internal.controller';
import { ServiceKeyGuard } from './guards/service-key.guard';
import { UsersModule } from '../users/users.module';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [InternalController],
  providers: [ServiceKeyGuard],
})
export class InternalModule {}
