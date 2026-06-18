import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { WishlistService } from './wishlist.service';
import {
  Wishlist as WishlistSchemaClass,
  WishlistSchema,
  WishlistDocument,
} from './schemas/wishlist.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
} from '../../test/helpers/mongo';
import { RoomsService } from '../rooms/rooms.service';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistModel: Model<WishlistDocument>;

  beforeAll(async () => {
    const uri = await startInMemoryMongo();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: WishlistSchemaClass.name, schema: WishlistSchema },
        ]),
      ],
      providers: [
        WishlistService,
        {
          provide: RoomsService,
          useValue: { findById: async () => ({ status: 'drawn' }) },
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    wishlistModel = module.get<Model<WishlistDocument>>(
      getModelToken(WishlistSchemaClass.name),
    );
    await wishlistModel.ensureIndexes();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await wishlistModel.deleteMany({});
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    test('stores the wishlist and returns { roomId, userId, items }', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const result = await service.set(roomId, userId, [
        { name: 'repair tools' },
        { name: 'cup' },
      ]);

      expect(result).toEqual({
        roomId,
        userId,
        items: [{ name: 'repair tools' }, { name: 'cup' }],
      });
    });

    test('overwrites a previous wishlist for the same (roomId, userId)', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      await service.set(roomId, userId, [{ name: 'old' }]);
      const result = await service.set(roomId, userId, [{ name: 'new' }]);

      expect(result.items).toEqual([{ name: 'new' }]);
      expect((await service.get(roomId, userId))?.items).toEqual([
        { name: 'new' },
      ]);
    });

    test('only one document persists per (roomId, userId) — upsert + compound unique index', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      await service.set(roomId, userId, [{ name: 'book' }]);
      await service.set(roomId, userId, [{ name: 'socks', priority: 1 }]);

      const count = await wishlistModel.countDocuments({ userId, roomId });
      expect(count).toBe(1);
    });

    test('isolates wishlists per (roomId, userId) — same user, different rooms', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const roomA = new mongoose.Types.ObjectId().toString();
      const roomB = new mongoose.Types.ObjectId().toString();

      await service.set(roomA, userId, [{ name: 'a' }]);
      await service.set(roomB, userId, [{ name: 'b' }]);

      expect((await service.get(roomA, userId))?.items).toEqual([
        { name: 'a' },
      ]);
      expect((await service.get(roomB, userId))?.items).toEqual([
        { name: 'b' },
      ]);
    });

    test('isolates wishlists per (roomId, userId) — same room, different users', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userA = new mongoose.Types.ObjectId().toString();
      const userB = new mongoose.Types.ObjectId().toString();

      await service.set(roomId, userA, [{ name: 'a' }]);
      await service.set(roomId, userB, [{ name: 'b' }]);

      expect((await service.get(roomId, userA))?.items).toEqual([
        { name: 'a' },
      ]);
      expect((await service.get(roomId, userB))?.items).toEqual([
        { name: 'b' },
      ]);
    });
  });

  describe('get', () => {
    test('returns the stored wishlist when one exists', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      await service.set(roomId, userId, [{ name: 'cup' }]);

      expect(await service.get(roomId, userId)).toEqual({
        roomId,
        userId,
        items: [{ name: 'cup' }],
      });
    });

    test('returns undefined when no wishlist exists for that pair', async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      expect(await service.get(roomId, userId)).toBeUndefined();
    });

    test("does not return another user's wishlist for the same room", async () => {
      const roomId = new mongoose.Types.ObjectId().toString();
      const userA = new mongoose.Types.ObjectId().toString();
      const userB = new mongoose.Types.ObjectId().toString();

      await service.set(roomId, userA, [{ name: 'a' }]);

      expect(await service.get(roomId, userB)).toBeUndefined();
    });
  });
});
