import { sattoloCycle, generateAssignments } from './derangement';

describe('Derangement Utilities', () => {
  describe('sattoloCycle', () => {
    it('should generate a derangement (no element in original position) over 1000 iterations', () => {
      const input = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

      for (let run = 0; run < 1000; run++) {
        const result = sattoloCycle(input);
        expect(result.length).toBe(input.length);

        for (let i = 0; i < input.length; i++) {
          expect(result[i]).not.toBe(input[i]);
        }
      }
    });

    it('should work for an array of 3 elements', () => {
      const input = ['A', 'B', 'C'];
      for (let run = 0; run < 100; run++) {
        const result = sattoloCycle(input);
        expect(result[0]).not.toBe('A');
        expect(result[1]).not.toBe('B');
        expect(result[2]).not.toBe('C');
      }
    });
  });

  describe('generateAssignments', () => {
    it('should generate valid giver-receiver pairs without self-assignments', () => {
      const ids = ['user1', 'user2', 'user3', 'user4'];
      const assignments = generateAssignments(ids);

      expect(assignments.length).toBe(4);
      assignments.forEach((assignment) => {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      });

      const givers = new Set(assignments.map((a) => a.giverId));
      const receivers = new Set(assignments.map((a) => a.receiverId));

      expect(givers.size).toBe(4);
      expect(receivers.size).toBe(4);
    });

    it('should throw an error if fewer than 3 participants', () => {
      expect(() => generateAssignments(['user1', 'user2'])).toThrow(
        'At least 3 participants are required for a Secret Santa draw',
      );
    });
  });
});
