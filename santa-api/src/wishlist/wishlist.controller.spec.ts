import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WishlistController } from './wishlist.controller';
import { WishlistService, type Wishlist } from './wishlist.service';

describe('WishlistController', () => {
  let controller: WishlistController;
  let service: jest.Mocked<WishlistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        {
          provide: WishlistService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
    service = module.get(WishlistService);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /rooms/:roomId/wishlist', () => {
    test('delegates to service.set with roomId from the path and returns the wishlist', () => {
      const roomId = randomUUID();
      const userId = randomUUID();
      const wishlist: Wishlist = {
        roomId,
        userId,
        items: ['car accessories', 'cup'],
      };
      service.set.mockReturnValue(wishlist);

      const result = controller.upsert(roomId, {
        userId,
        items: ['car accessories', 'cup'],
      });

      expect(service.set).toHaveBeenCalledWith(roomId, userId, [
        'car accessories',
        'cup',
      ]);
      expect(result).toBe(wishlist);
    });
  });

  describe('GET /rooms/:roomId/wishlist/:userId', () => {
    test('returns the wishlist when one exists', () => {
      const roomId = randomUUID();
      const userId = randomUUID();
      const wishlist: Wishlist = { roomId, userId, items: ['cup'] };
      service.get.mockReturnValue(wishlist);

      const result = controller.findOne(roomId, userId);

      expect(service.get).toHaveBeenCalledWith(roomId, userId);
      expect(result).toBe(wishlist);
    });

    test('throws NotFoundException when no wishlist exists', () => {
      service.get.mockReturnValue(undefined);

      expect(() => controller.findOne(randomUUID(), randomUUID())).toThrow(
        NotFoundException,
      );
    });
  });
});
