import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist } from './wishlist.types';
import {
  Wishlist as WishlistModel,
  WishlistDocument,
} from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
  ) {}

  // TODO (Lesson: Wishlist) — upsert the wishlist for {userId, roomId} with `items`.
  async set(
    roomId: string,
    userId: string,
    items: string[],
  ): Promise<Wishlist> {
    const doc = await this.wishlistModel
      .findOneAndUpdate(
        { roomId, userId },
        { $set: { items } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return this.toWishlist(doc);
  }

  // TODO (Lesson: Wishlist) — return the wishlist for {roomId, userId}. If the user
  // has none yet, return an EMPTY one ({ roomId, userId, items: [] }) — not a 404.
  async get(roomId: string, userId: string): Promise<Wishlist> {
    const doc = await this.wishlistModel.findOne({ roomId, userId }).exec();

    if (!doc) {
      return { roomId, userId, items: [] };
    }

    return this.toWishlist(doc);
  }

  private toWishlist(doc: WishlistDocument): Wishlist {
    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }
}
