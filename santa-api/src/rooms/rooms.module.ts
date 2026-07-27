import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './rooms.service';
import { RoomPermissionsGuard } from './guards/room-permissions.guard';

@Module({
  imports: [
    RedisModule,
    UsersModule,
    WishlistModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomPermissionsGuard],
})
export class RoomsModule {}
