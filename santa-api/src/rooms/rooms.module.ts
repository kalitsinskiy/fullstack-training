import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { RedisModule } from '../common/redis/redis.module';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './rooms.service';
import { RoomPermissionsGuard } from './guards/room-permissions.guard';
import { EventPublisherModule } from 'src/events/eventPublisher.module';

@Module({
  imports: [
    UsersModule,
    WishlistModule,
    RedisModule,
    EventPublisherModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomPermissionsGuard],
})
export class RoomsModule {}
