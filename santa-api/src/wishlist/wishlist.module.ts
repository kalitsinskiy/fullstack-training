import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../events/events.module';
import { WishlistController } from './wishlist.controller';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { WishlistService } from './wishlist.service';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { RoomPermissionsGuard } from '../rooms/guards/room-permissions.guard';

@Module({
  imports: [
    EventsModule,
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService, RoomPermissionsGuard],
  exports: [WishlistService],
})
export class WishlistModule {}
