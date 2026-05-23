import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from '../schemas/wishlist.schema';
import { WishlistResponseDto } from '../dto/wishlist-response.dto';
import { WishlistItemDto } from '../dto/update-wishlist.dto';

@Injectable()
export class WishlistRepository {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<Wishlist>,
  ) {}

  async set(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    items: WishlistItemDto[],
  ): Promise<WishlistResponseDto> {
    const doc = await this.wishlistModel
      .findOneAndUpdate(
        { userId, roomId },
        { $set: { items } },
        { upsert: true, new: true },
      )
      .exec();
    return new WishlistResponseDto(doc as any);
  }

  async get(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<WishlistResponseDto | null> {
    const doc = await this.wishlistModel.findOne({ userId, roomId }).exec();
    return doc ? new WishlistResponseDto(doc as any) : null;
  }

  async delete(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.wishlistModel
      .findOneAndDelete({ userId, roomId })
      .exec();
    return result !== null;
  }
}
