import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { RedisModule } from '../redis/redis.module';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './rooms.service';
import { RoomPermissionsGuard } from './guards/room-permissions.guard';

@Module({
  imports: [
    EventsModule,
    UsersModule,
    WishlistModule,
    RedisModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomPermissionsGuard],
  exports: [RoomsService],
})
export class RoomsModule {}
