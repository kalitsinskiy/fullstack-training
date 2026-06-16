import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    UsersModule,
  ],
  providers: [WishlistService],
  controllers: [WishlistController],
  exports: [WishlistService],
})
export class WishlistModule {}
