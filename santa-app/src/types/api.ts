export interface User {
  id: string;
  email: string;
  name: string;
}

export type RoomStatus = 'pending' | 'drawn';

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  code: string;
  members: string[];
  status: RoomStatus;
  drawDate?: string;
  exchangeDate?: string;
  exchangePlace: string;
  assignments?: Record<string, string>;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface WishlistItem {
  name: string;
  url?: string;
  priority?: number;
}

export interface Wishlist {
  roomId: string;
  userId: string;
  userName?: string; // present on GET …/wishlist/:userId; absent on the POST (set) response
  items: WishlistItem[];
}
