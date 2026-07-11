/**
 * Sattolo's algorithm
 * O(n) without retries
 */
export function derange<T>(items: readonly T[]): T[] {
  if (items.length < 2) {
    throw new Error('A derangement needs at least 2 items');
  }

  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * i);

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
