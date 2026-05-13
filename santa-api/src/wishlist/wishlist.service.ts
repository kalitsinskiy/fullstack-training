import { Injectable } from '@nestjs/common';

export interface Wishlist {
  roomId: string;
  userId: string;
  items: string[];
}

@Injectable()
export class WishlistService {
  private readonly wishlists = new Map<string, string[]>();

  set(roomId: string, userId: string, items: string[]): Wishlist {
    this.wishlists.set(this.key(roomId, userId), items);
    return { roomId, userId, items };
  }

  get(roomId: string, userId: string): Wishlist | undefined {
    const items = this.wishlists.get(this.key(roomId, userId));

    if (!items) return undefined;

    return { roomId, userId, items };
  }

  private key(roomId: string, userId: string): string {
    return `${roomId}:${userId}`;
  }
}
