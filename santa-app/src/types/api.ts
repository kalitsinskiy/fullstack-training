/**
 * Shared API types — mirror santa-api/docs/api-contract.md.
 * Keep these in sync with the backend contract.
 */

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
  /**
   * The caller's effective permissions for this room — the single source for UI
   * gating. Optional: the API populates it from Lesson 04 (authorization) onward.
   */
  viewerPermissions?: Permission[];
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
  type: string;
  message: string;
  payload?: unknown;
  read: boolean;
  createdAt: string;
}
