import { randomInt } from 'node:crypto';

/**
 * Sattolo's algorithm — produces a single-cycle permutation, which is always a
 * derangement (no element keeps its original position). Perfect for Secret Santa:
 * nobody is ever assigned to themselves.
 *
 * The key vs Fisher–Yates: j is drawn from [0, i) (exclusive of i), which
 * guarantees every element moves. Requires length >= 2.
 */
export function derange<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i); // 0 .. i-1
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
