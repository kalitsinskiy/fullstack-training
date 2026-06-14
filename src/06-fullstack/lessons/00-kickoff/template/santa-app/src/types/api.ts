/**
 * Shared API types — mirror santa-api/docs/api-contract.md.
 * Keep these in sync with the backend contract.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  // register also returns the user fields; login returns only the token
  id?: string;
  email?: string;
  displayName?: string;
}

export type RoomStatus = 'pending' | 'drawn';

export interface RoomSummary {
  id: string;
  name: string;
  status: RoomStatus;
  participantCount: number;
}

export type RoomMember = Pick<User, 'id' | 'displayName'>;

export interface RoomDetail {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  status: RoomStatus;
  participants: RoomMember[];
  participantCount: number;
  drawDate?: string;
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
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
