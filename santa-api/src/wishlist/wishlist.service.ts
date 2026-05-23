import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { WishlistRepository } from './repositories/wishlist.repository';
import { WishlistItemDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  set(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    items: WishlistItemDto[],
  ): Promise<WishlistResponseDto> {
    return this.wishlistRepository.set(roomId, userId, items);
  }

  get(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<WishlistResponseDto | null> {
    return this.wishlistRepository.get(roomId, userId);
  }

  delete(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    return this.wishlistRepository.delete(roomId, userId);
  }
}
