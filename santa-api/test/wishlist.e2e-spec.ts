import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Connection, Model, Types } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { User, UserDocument } from '../src/users/schemas/users.schema';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongo';
import { userFixture } from './helpers/factories';
import { tokenFor } from './helpers/auth-token';

describe('WishlistController (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;
  let jwt: JwtService;
  let userModel: Model<UserDocument>;
  let user: ReturnType<typeof userFixture>;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
    await startInMemoryMongo();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Replace the throttler's storage so totalHits is always 0 -> never trips.
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: async () => ({
          totalHits: 0,
          timeToExpire: 0,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    connection = app.get<Connection>(getConnectionToken());
    jwt = app.get(JwtService);
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    user = userFixture({ email: 'wishlist@test.com' });
    await userModel.create(user);
    token = tokenFor(jwt, user);
  });

  const authedPost = (url: string, payload: unknown, asToken: string = token) =>
    app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'POST',
        url,
        payload,
        headers: { authorization: `Bearer ${asToken}` },
      });

  const authedGet = (url: string, asToken: string = token) =>
    app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'GET',
        url,
        headers: { authorization: `Bearer ${asToken}` },
      });

  describe('POST /rooms/:roomId/wishlist', () => {
    test('returns 200 with the wishlist on first set; userId comes from the JWT', async () => {
      const roomId = new Types.ObjectId().toString();

      const res = await authedPost(`/rooms/${roomId}/wishlist`, {
        items: [{ name: 'hat' }, { name: 'book' }, { name: 'cup' }],
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        roomId,
        userId: user._id.toString(),
        items: [{ name: 'hat' }, { name: 'book' }, { name: 'cup' }],
      });
    });

    test('overwrites a previous wishlist for the same user', async () => {
      const roomId = new Types.ObjectId().toString();

      await authedPost(`/rooms/${roomId}/wishlist`, {
        items: [{ name: 'old' }],
      });
      const res = await authedPost(`/rooms/${roomId}/wishlist`, {
        items: [{ name: 'new' }],
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().items).toEqual([{ name: 'new' }]);
    });

    test('stores a separate wishlist per user in the same room', async () => {
      const roomId = new Types.ObjectId().toString();

      const otherUser = userFixture({ email: 'other@test.com' });
      await userModel.create(otherUser);
      const otherToken = tokenFor(jwt, otherUser);

      await authedPost(`/rooms/${roomId}/wishlist`, {
        items: [{ name: 'mine' }],
      });
      await authedPost(
        `/rooms/${roomId}/wishlist`,
        { items: [{ name: 'theirs' }] },
        otherToken,
      );

      const mine = await authedGet(
        `/rooms/${roomId}/wishlist/${user._id.toString()}`,
      );
      const theirs = await authedGet(
        `/rooms/${roomId}/wishlist/${otherUser._id.toString()}`,
      );

      expect(mine.json().items).toEqual([{ name: 'mine' }]);
      expect(theirs.json().items).toEqual([{ name: 'theirs' }]);
    });
  });

  describe('POST /rooms/:roomId/wishlist — validation', () => {
    test('returns 400 when items contains an empty name', async () => {
      const res = await authedPost(
        `/rooms/${new Types.ObjectId().toString()}/wishlist`,
        { items: [{ name: 'ok' }, { name: '' }] },
      );
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when items is not an array', async () => {
      const res = await authedPost(
        `/rooms/${new Types.ObjectId().toString()}/wishlist`,
        { items: 'socks' },
      );
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when items is missing', async () => {
      const res = await authedPost(
        `/rooms/${new Types.ObjectId().toString()}/wishlist`,
        {},
      );
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when an unknown field is sent (whitelist guard)', async () => {
      const res = await authedPost(
        `/rooms/${new Types.ObjectId().toString()}/wishlist`,
        { items: [{ name: 'x' }], public: true },
      );
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when userId is supplied in the body (now derived from JWT)', async () => {
      const res = await authedPost(
        `/rooms/${new Types.ObjectId().toString()}/wishlist`,
        { userId: new Types.ObjectId().toString(), items: [{ name: 'x' }] },
      );
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /rooms/:roomId/wishlist — auth', () => {
    test('returns 401 without a token', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: `/rooms/${new Types.ObjectId().toString()}/wishlist`,
          payload: { items: [{ name: 'x' }] },
        });
      expect(res.statusCode).toBe(401);
    });

    test('returns 401 with a malformed Authorization header', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: `/rooms/${new Types.ObjectId().toString()}/wishlist`,
          payload: { items: [{ name: 'x' }] },
          headers: { authorization: 'Bearer not-a-real-jwt' },
        });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /rooms/:roomId/wishlist/:userId', () => {
    test('returns 200 with the wishlist when one exists', async () => {
      const roomId = new Types.ObjectId().toString();
      await authedPost(`/rooms/${roomId}/wishlist`, {
        items: [{ name: 'mug' }],
      });

      const res = await authedGet(
        `/rooms/${roomId}/wishlist/${user._id.toString()}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        roomId,
        userId: user._id.toString(),
        userName: 'Test User',
        items: [{ name: 'mug' }],
      });
    });

    test('returns 404 with the error envelope when no wishlist exists', async () => {
      const res = await authedGet(
        `/rooms/${new Types.ObjectId().toString()}/wishlist/${new Types.ObjectId().toString()}`,
      );

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('not found'),
        timestamp: expect.any(String),
      });
    });

    test('returns 401 without a token', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'GET',
          url: `/rooms/${new Types.ObjectId().toString()}/wishlist/${new Types.ObjectId().toString()}`,
        });
      expect(res.statusCode).toBe(401);
    });
  });
});
