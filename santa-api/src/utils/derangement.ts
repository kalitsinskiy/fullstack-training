import { Assignment } from '../rooms/room.types';

export function sattoloCycle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  let i = result.length;

  while (i > 1) {
    i -= 1;
    const j = Math.floor(Math.random() * i); // 0 <= j < i  (exclusive of i)
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function generateAssignments(participantIds: string[]): Assignment[] {
  if (participantIds.length < 2) {
    throw new Error('At least 2 participants are required to draw');
  }

  const receivers = sattoloCycle(participantIds);

  return participantIds.map((giverId, index) => ({
    giverId,
    receiverId: receivers[index],
  }));
}
