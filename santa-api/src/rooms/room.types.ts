import type { Permission, RoomRole } from './permissions';

/** A room member, as returned in room responses (participants are populated). */
export interface RoomParticipant {
  id: string;
  displayName: string;
  role: RoomRole;
}

export interface Room {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  participants: RoomParticipant[];
  participantCount: number;
  status: 'pending' | 'drawn';
  drawDate?: string;
  budget?: number;
  currency?: string;
  exchangeDate?: string;
  /**
   * The caller's effective permissions for THIS room — the single source for FE
   * gating. Optional: populated from Lesson 04 onward (the authorization lesson);
   * earlier lessons may omit it.
   */
  viewerPermissions?: Permission[];
}

/** Persisted giver -> receiver pairing produced by the draw. */
export interface Assignment {
  giverId: string;
  receiverId: string;
}

/** Shape returned by GET /rooms/:id/assignment (your giftee). */
export interface AssignmentView {
  receiver: {
    id: string;
    displayName: string;
    wishlist: string[];
  };
}
