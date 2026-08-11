/**
 * Shared API types — mirror santa-api/docs/api-contract.md.
 * Keep these in sync with the backend contract.
 */

import type { Currency } from '@/schemas/rooms';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  accessToken: string;
  // register also returns the user fields; login returns only the token
  id?: string;
  email?: string;
  displayName?: string;
}

export type RoomStatus = 'pending' | 'drawn';

/** A participant's role within a single room. */
export type RoomRole = 'owner' | 'member';

/** Room capabilities. Gate UI on these permissions, never on the role. */
export type Permission =
  | 'room:view'
  | 'room:draw'
  | 'room:invite'
  | 'room:kick'
  | 'room:edit'
  | 'room:delete'
  | 'wishlist:set';

export interface RoomSummary {
  id: string;
  name: string;
  status: RoomStatus;
  participantCount: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type RoomMember = Pick<User, 'id' | 'displayName'> & { role: RoomRole };

export interface RoomDetail {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  status: RoomStatus;
  participants: RoomMember[];
  participantCount: number;
  drawDate?: string;
  budget?: number;
  currency?: Currency;
  exchangeDate?: string;
  viewerPermissions?: Permission[];
}

export interface CreateRoomInput {
  name: string;
  budget?: number;
  currency?: Currency;
}

export interface UpdateRoomInput {
  name?: string;
  budget?: number;
  currency?: Currency;
  exchangeDate?: string;
}

export interface Wishlist {
  userId: string;
  roomId: string;
  items: string[];
}

export interface Assignment {
  receiver: Pick<User, 'id' | 'displayName'> & { wishlist: string[] };
}

export interface Notification {
  id: string;
  userId: string;
  roomId?: string | null;
  type: string;
  message: string;
  payload?: unknown;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export type MessageThreadKey = 'giftee' | 'santa';

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
  read?: boolean;
}

export interface MessageThreads {
  giftee: { id: string; name: string; messages: ChatMessage[] } | null;
  santa: { messages: ChatMessage[] } | null;
}

export interface SendMessageInput {
  roomId: string;
  to: MessageThreadKey;
  text: string;
}

export interface IncomingMessage extends ChatMessage {
  roomId: string;
  thread: MessageThreadKey;
}

export interface UnreadMessages {
  total: number;
  rooms: Array<{ roomId: string; count: number }>;
}
