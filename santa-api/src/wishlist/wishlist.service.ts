import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist } from './wishlist.types';
import { Wishlist as WishlistModel } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
  ) {}

  // TODO (Lesson: Wishlist) — upsert the wishlist for {userId, roomId} with `items`.
  set(roomId: string, userId: string, items: string[]): Promise<Wishlist> {
    throw new NotImplementedException('WishlistService.set is not implemented');
  }

  // TODO (Lesson: Wishlist) — return the wishlist for {roomId, userId}. If the user
  // has none yet, return an EMPTY one ({ roomId, userId, items: [] }) — not a 404.
  get(roomId: string, userId: string): Promise<Wishlist> {
    throw new NotImplementedException('WishlistService.get is not implemented');
  }
}
