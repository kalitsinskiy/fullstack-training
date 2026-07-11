import { derange } from './derangement';

describe('derrange (Stattolo cycle)', () => {
  it('throws for fewer than 3 items', () => {
    expect(() => derange([1])).toThrow('A derangement needs at least 2 items');
  });

  it('never map an element to its own position (1000 runs)', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];

    for (let run = 0; run < 1000; run++) {
      const out = derange(ids);

      out.forEach((value, index) => expect(value).not.toBe(ids[index]));
    }
  });

  it('the result is the same set with same length from input', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const out = derange(ids);

    expect(out).toHaveLength(ids.length);
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it('the derange function is not pure function', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const seen = new Set(
      Array.from({ length: 50 }, () => derange(ids).join('')),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});
