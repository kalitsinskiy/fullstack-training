import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { randomUUID } from 'node:crypto';

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistService],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    test('stores the wishlist and returns { roomId, userId, items }', () => {
      const roomId = randomUUID();
      const userId = randomUUID();

      const result = service.set(roomId, userId, ['repair tools', 'cup']);

      expect(result).toEqual({
        roomId,
        userId,
        items: ['repair tools', 'cup'],
      });
    });

    test('overwrites a previous wishlist for the same (roomId, userId)', () => {
      const roomId = randomUUID();
      const userId = randomUUID();

      service.set(roomId, userId, ['old']);
      const result = service.set(roomId, userId, ['new']);

      expect(result.items).toEqual(['new']);
      expect(service.get(roomId, userId)?.items).toEqual(['new']);
    });

    test('isolates wishlists per (roomId, userId) — same user, different rooms', () => {
      const userId = randomUUID();
      const roomA = randomUUID();
      const roomB = randomUUID();

      service.set(roomA, userId, ['a']);
      service.set(roomB, userId, ['b']);

      expect(service.get(roomA, userId)?.items).toEqual(['a']);
      expect(service.get(roomB, userId)?.items).toEqual(['b']);
    });

    test('isolates wishlists per (roomId, userId) — same room, different users', () => {
      const roomId = randomUUID();
      const userA = randomUUID();
      const userB = randomUUID();

      service.set(roomId, userA, ['a']);
      service.set(roomId, userB, ['b']);

      expect(service.get(roomId, userA)?.items).toEqual(['a']);
      expect(service.get(roomId, userB)?.items).toEqual(['b']);
    });
  });

  describe('get', () => {
    test('returns the stored wishlist when one exists', () => {
      const roomId = randomUUID();
      const userId = randomUUID();
      service.set(roomId, userId, ['cup']);

      expect(service.get(roomId, userId)).toEqual({
        roomId,
        userId,
        items: ['cup'],
      });
    });
  });

  test('returns undefined when no wishlist exists for that pair', () => {
    expect(service.get(randomUUID(), randomUUID())).toBeUndefined();
  });

  test("does not return another user's wishlist for the same room", () => {
    const roomId = randomUUID();
    const userA = randomUUID();
    const userB = randomUUID();

    service.set(roomId, userA, ['a']);

    expect(service.get(roomId, userB)).toBeUndefined();
  });
});
