import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './wishlist.types';
import { Wishlist as WishlistModel } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
  ) {}

  async set(roomId: string, userId: string, items: string[]): Promise<Wishlist> {
    const wishlist = await this.wishlistModel
      .findOneAndUpdate(
        { userId, roomId },
        { $set: { items } },
        { upsert: true, new: true },
      )
      .exec();

    return this.toWishlist(wishlist);
  }

  async get(roomId: string, userId: string): Promise<Wishlist | undefined> {
    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(userId)) {
      return undefined;
    }

    const wishlist = await this.wishlistModel.findOne({ roomId, userId }).exec();

    if (!wishlist) {
      return undefined;
    }

    return this.toWishlist(wishlist);
  }

  private toWishlist(wishlist: {
    roomId: Types.ObjectId;
    userId: Types.ObjectId;
    items: string[];
  }): Wishlist {
    return {
      roomId: wishlist.roomId.toString(),
      userId: wishlist.userId.toString(),
      items: [...wishlist.items],
    };
  }
}
