import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { WishlistItemDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  set(roomId: string, userId: string, items: WishlistItemDto[]) {
    return this.wishlistModel
      .findOneAndUpdate(
        { userId, roomId },
        { $set: { items } },
        { upsert: true, new: true },
      )
      .exec();
  }

  get(roomId: string, userId: string) {
    return this.wishlistModel.findOne({ userId, roomId }).exec();
  }
}
