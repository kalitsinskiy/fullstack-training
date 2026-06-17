/** A room member, as returned in room responses (participants are populated). */
export interface RoomParticipant {
  id: string;
  displayName: string;
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
