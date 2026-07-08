import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './schemas/wishlist.schema';

describe('WishlistService', () => {
  let service: WishlistService;

  const mockWishlistModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };

  const roomId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getModelToken(Wishlist.name), useValue: mockWishlistModel },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('upserts and returns the wishlist', async () => {
      const items = ['Wool socks', 'A good book'];
      const doc = {
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
        items,
      };
      mockWishlistModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.set(roomId, userId, items);

      expect(mockWishlistModel.findOneAndUpdate).toHaveBeenCalledWith(
        { roomId: new Types.ObjectId(roomId), userId: new Types.ObjectId(userId) },
        { $set: { items } },
        { upsert: true, new: true },
      );
      expect(result).toEqual({ roomId, userId, items });
    });
  });

  describe('get', () => {
    it('returns the wishlist when it exists', async () => {
      const items = ['Chocolate'];
      const doc = {
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
        items,
      };
      mockWishlistModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.get(roomId, userId);

      expect(mockWishlistModel.findOne).toHaveBeenCalledWith({
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      });
      expect(result).toEqual({ roomId, userId, items });
    });

    it('returns an empty items array when no wishlist exists', async () => {
      mockWishlistModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.get(roomId, userId);

      expect(result).toEqual({ roomId, userId, items: [] });
    });
  });
});
