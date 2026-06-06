export interface Room {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  participants: string[];
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
