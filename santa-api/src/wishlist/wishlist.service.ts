import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Wishlist as WishlistSchemaClass,
  WishlistDocument,
  WishlistItem,
} from './schemas/wishlist.schema';
import { RoomsService } from '../rooms/rooms.service';

export interface Wishlist {
  roomId: string;
  userId: string;
  items: WishlistItem[];
}

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistSchemaClass.name)
    private readonly wishlistModel: Model<WishlistDocument>,
    private readonly roomsService: RoomsService,
  ) {}

  async set(
    roomId: string,
    userId: string,
    items: WishlistItem[],
  ): Promise<Wishlist> {
    const room = await this.roomsService.findById(roomId);

    if (room?.status === 'closed')
      throw new ForbiddenException(
        'Wishlist is locked - the exchange date has passed',
      );

    const doc = await this.wishlistModel.findOneAndUpdate(
      { userId, roomId },
      { $set: { items } },
      { upsert: true, new: true, runValidators: true },
    );

    return this.toPublic(doc);
  }

  async get(roomId: string, userId: string): Promise<Wishlist | undefined> {
    const doc = await this.wishlistModel.findOne({ userId, roomId });
    return doc ? this.toPublic(doc) : undefined;
  }

  private toPublic(doc: WishlistDocument): Wishlist {
    return {
      roomId: doc.roomId,
      userId: doc.userId,
      items: doc.items.map((item) => {
        const out: WishlistItem = { name: item.name };
        if (item.url !== undefined) out.url = item.url;
        if (item.priority !== undefined) out.priority = item.priority;
        return out;
      }),
    };
  }
}
