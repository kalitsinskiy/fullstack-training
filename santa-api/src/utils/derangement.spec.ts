import { generateAssignments, sattoloCycle } from './derangement';

describe('sattoloCycle', () => {
  it('returns a new array without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    const snapshot = [...input];
    const result = sattoloCycle(input);

    expect(result).not.toBe(input);
    expect(input).toEqual(snapshot);
  });

  it('is a permutation (same elements, possibly reordered)', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const result = sattoloCycle(input);

    expect([...result].sort()).toEqual([...input].sort());
  });

  it('never leaves an element in its original position (1000 runs)', () => {
    const input = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let run = 0; run < 1000; run += 1) {
      const result = sattoloCycle(input);
      result.forEach((value, index) => {
        expect(value).not.toBe(input[index]);
      });
    }
  });

  it('produces different orderings across runs (is random)', () => {
    const input = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seen = new Set<string>();

    for (let run = 0; run < 50; run += 1) {
      seen.add(sattoloCycle(input).join(','));
    }

    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('generateAssignments', () => {
  it('pairs every participant exactly once as giver and once as receiver', () => {
    const participants = ['1', '2', '3', '4', '5'];
    const assignments = generateAssignments(participants);

    expect(assignments).toHaveLength(participants.length);

    const givers = assignments.map((a) => a.giverId).sort();
    const receivers = assignments.map((a) => a.receiverId).sort();
    expect(givers).toEqual([...participants].sort());
    expect(receivers).toEqual([...participants].sort());
  });

  it('never assigns anyone to themselves (1000 runs)', () => {
    const participants = ['1', '2', '3', '4'];

    for (let run = 0; run < 1000; run += 1) {
      for (const { giverId, receiverId } of generateAssignments(participants)) {
        expect(giverId).not.toBe(receiverId);
      }
    }
  });

  it('throws when there are fewer than 2 participants', () => {
    expect(() => generateAssignments(['solo'])).toThrow();
  });
});
