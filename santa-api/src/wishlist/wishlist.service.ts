import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventPublisherService } from '../events/event-publisher.service';
import { Wishlist } from './wishlist.types';
import { Wishlist as WishlistModel } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private validateIds(roomId: string, userId: string): void {
    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid room or user id');
    }
  }

  async set(
    roomId: string,
    userId: string,
    items: string[],
  ): Promise<Wishlist> {
    this.validateIds(roomId, userId);
    const doc = await this.wishlistModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          roomId: new Types.ObjectId(roomId),
        },
        { items },
        { upsert: true, new: true },
      )
      .exec();

    this.eventPublisher.publish('wishlist.updated', { roomId, userId });

    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }

  async get(roomId: string, userId: string): Promise<Wishlist> {
    this.validateIds(roomId, userId);
    const doc = await this.wishlistModel
      .findOne({
        userId: new Types.ObjectId(userId),
        roomId: new Types.ObjectId(roomId),
      })
      .exec();

    if (!doc) {
      return { roomId, userId, items: [] };
    }

    return {
      roomId: doc.roomId.toString(),
      userId: doc.userId.toString(),
      items: doc.items,
    };
  }
}
