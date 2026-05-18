import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './schemas/wishlist.schema';

describe('WishlistService', () => {
  let service: WishlistService;
  const exec = jest.fn();
  const findOneAndUpdate = jest.fn(() => ({ exec }));
  const findOne = jest.fn(() => ({ exec }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: {
            findOneAndUpdate,
            findOne,
          },
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert wishlist items', async () => {
    const roomId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const items = [{ name: 'book' }, { name: 'socks', priority: 1 }];
    const savedWishlist = { roomId, userId, items };
    exec.mockResolvedValue(savedWishlist);

    const result = await service.set(roomId, userId, items);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { userId, roomId },
      { $set: { items } },
      { upsert: true, new: true },
    );
    expect(result).toEqual(savedWishlist);
  });

  it('should get wishlist by room and user', async () => {
    const roomId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const wishlist = {
      roomId,
      userId,
      items: [{ name: 'book' }],
    };
    exec.mockResolvedValue(wishlist);

    const result = await service.get(roomId, userId);

    expect(findOne).toHaveBeenCalledWith({ userId, roomId });
    expect(result).toEqual(wishlist);
  });
});
