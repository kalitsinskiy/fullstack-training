import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './schemas/wishlist.schema';
import { WishlistItemDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<Wishlist>,
  ) {}

  set(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    items: WishlistItemDto[],
  ) {
    return this.wishlistModel
      .findOneAndUpdate(
        { userId, roomId },
        { $set: { items } },
        { upsert: true, new: true },
      )
      .exec();
  }

  get(roomId: Types.ObjectId, userId: Types.ObjectId) {
    return this.wishlistModel.findOne({ userId, roomId }).exec();
  }
}
