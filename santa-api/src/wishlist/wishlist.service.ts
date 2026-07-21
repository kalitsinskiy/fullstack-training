import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './wishlist.types';
import { Wishlist as WishlistModel } from './schemas/wishlist.schema';
import { EventPublisherService } from 'src/events/eventPublisher.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
    private readonly eventPublisherService: EventPublisherService,
  ) {}

  async set(
    roomId: string,
    userId: string,
    items: string[],
  ): Promise<Wishlist> {
    const doc = await this.wishlistModel
      .findOneAndUpdate(
        {
          roomId: new Types.ObjectId(roomId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { items } },
        { upsert: true, new: true },
      )
      .exec();

    await this.eventPublisherService.publish('wishlist.updated', {
      roomId,
      userId,
    });
    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }

  async get(roomId: string, userId: string): Promise<Wishlist> {
    const doc = await this.wishlistModel
      .findOne({
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!doc) return { roomId, userId, items: [] };
    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }
}
