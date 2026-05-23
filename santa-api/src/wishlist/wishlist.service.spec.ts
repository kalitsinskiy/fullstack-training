import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './repositories/wishlist.repository';

describe('WishlistService', () => {
  let service: WishlistService;
  const set = jest.fn();
  const get = jest.fn();
  const remove = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: WishlistRepository,
          useValue: {
            set,
            get,
            delete: remove,
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
    set.mockResolvedValue(savedWishlist);

    const result = await service.set(roomId, userId, items);

    expect(set).toHaveBeenCalledWith(roomId, userId, items);
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
    get.mockResolvedValue(wishlist);

    const result = await service.get(roomId, userId);

    expect(get).toHaveBeenCalledWith(roomId, userId);
    expect(result).toEqual(wishlist);
  });
});
