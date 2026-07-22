/**
 * Sattolo's algorithm generates a random cyclic permutation of an array.
 * Every cyclic permutation is a derangement (no element maps to itself in the same index position).
 */
export function sattoloCycle<T>(arr: T[]): T[] {
  if (arr.length < 2) {
    return [...arr];
  }

  const result = [...arr];
  let i = result.length;

  while (i > 1) {
    i--;
    // Pick j from 0 to i-1 (exclusive of i)
    const j = Math.floor(Math.random() * i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate Secret Santa assignments for a list of participant IDs.
 * Returns an array of { giverId, receiverId } pairs.
 */
export function generateAssignments<T extends { toString(): string }>(
  participantIds: T[],
): { giverId: T; receiverId: T }[] {
  if (participantIds.length < 3) {
    throw new Error('At least 3 participants are required for a Secret Santa draw');
  }

  const shuffled = sattoloCycle(participantIds);

  return participantIds.map((giverId, index) => ({
    giverId,
    receiverId: shuffled[index],
  }));
}
