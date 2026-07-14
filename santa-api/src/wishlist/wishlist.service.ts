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

  async set(
    roomId: string,
    userId: string,
    items: string[],
  ): Promise<Wishlist> {
    const wishlist = await this.wishlistModel
      .findOneAndUpdate(
        {
          roomId: new Types.ObjectId(roomId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { items } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    return {
      roomId: wishlist.roomId.toString(),
      userId: wishlist.userId.toString(),
      items: wishlist.items,
    };
  }

  async get(roomId: string, userId: string): Promise<Wishlist> {
    const wishlist = await this.wishlistModel
      .findOne({
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    return {
      roomId,
      userId,
      items: wishlist?.items ?? [],
    };
  }
}
