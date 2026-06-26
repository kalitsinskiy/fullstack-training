import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './wishlist.types';
import { Wishlist as WishlistModel } from './schemas/wishlist.schema';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
    private readonly events: EventPublisherService,
  ) {}

  // Upsert the wishlist for {userId, roomId} with `items`.
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
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
    this.events.publish('wishlist.updated', { roomId, userId });
    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }

  // Return the wishlist for {roomId, userId}. If none yet, return an EMPTY one.
  async get(roomId: string, userId: string): Promise<Wishlist> {
    const doc = await this.wishlistModel
      .findOne({
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return {
      roomId,
      userId,
      items: doc?.items ?? [],
    };
  }
}
