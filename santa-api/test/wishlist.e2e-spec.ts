import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from '@jest/globals';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection, Model, Types } from 'mongoose';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { User } from '../src/users/schemas/user.schema';
import { createTestApp } from './helpers/test-app.helper';
import { tokenFor } from './helpers/auth-token.helper';
import { userFixture } from './helpers/factories';
import { authedGet, authedPost, get, post } from './helpers/api-request.helper';

interface RoomResponse {
  _id: string;
}

interface WishlistResponse {
  userId: string;
  roomId: string;
  items: Array<{ name: string; url?: string; priority?: number }>;
}

describe('Wishlist (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleRef: TestingModule;
  let connection: Connection;
  let jwtService: JwtService;
  let userModel: Model<User>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'wishlist-e2e-test-secret';

    ({ app, connection, moduleRef } = await createTestApp({
      validation: true,
      globalPrefix: 'api',
    }));

    jwtService = moduleRef.get(JwtService);
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
  }, 30000);

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedUser() {
    const fixture = userFixture();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await userModel.create(fixture as any);
    const token = tokenFor(jwtService, {
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async function createRoom(token: string, name = 'Wishlist Room') {
    const res = await authedPost<RoomResponse>(app, '/api/rooms', token, {
      name,
    });
    return res.body;
  }

  function wishlistUrl(roomId: string, userId: string) {
    return `/api/rooms/${roomId}/wishlist/${userId}`;
  }

  describe('POST /api/rooms/:roomId/wishlist', () => {
    it('should save the wishlist and return 201', async () => {
      const { user, token } = await seedUser();
      const room = await createRoom(token);

      const res = await authedPost<WishlistResponse>(
        app,
        `/api/rooms/${room._id}/wishlist`,
        token,
        { items: [{ name: 'Mechanical keyboard', priority: 1 }] },
      );

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        userId: user._id.toString(),
        roomId: room._id,
        items: [
          expect.objectContaining({ name: 'Mechanical keyboard', priority: 1 }),
        ],
      });
    });

    it('should overwrite an existing wishlist for the same user and room', async () => {
      const { user, token } = await seedUser();
      const room = await createRoom(token);

      await authedPost(app, `/api/rooms/${room._id}/wishlist`, token, {
        items: [{ name: 'First item' }],
      });
      const res = await authedPost<WishlistResponse>(
        app,
        `/api/rooms/${room._id}/wishlist`,
        token,
        { items: [{ name: 'Replacement item' }] },
      );

      expect(res.statusCode).toBe(201);
      expect(res.body.items).toEqual([
        expect.objectContaining({ name: 'Replacement item' }),
      ]);

      const fetched = await authedGet<WishlistResponse>(
        app,
        wishlistUrl(room._id, user._id.toString()),
        token,
      );
      expect(fetched.body.items).toHaveLength(1);
    });

    it('should return 400 when items fail validation', async () => {
      const { token } = await seedUser();
      const room = await createRoom(token);

      const res = await authedPost(
        app,
        `/api/rooms/${room._id}/wishlist`,
        token,
        { items: [{ priority: 1 }] },
      );

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 when no token is provided', async () => {
      const { token } = await seedUser();
      const room = await createRoom(token);

      const res = await post(app, `/api/rooms/${room._id}/wishlist`, {
        items: [{ name: 'Item' }],
      });

      expect(res).toBeUnauthorized();
    });
  });

  describe('GET /api/rooms/:roomId/wishlist/:userId', () => {
    it('should return 200 with the wishlist when it exists', async () => {
      const { user, token } = await seedUser();
      const room = await createRoom(token);
      await authedPost(app, `/api/rooms/${room._id}/wishlist`, token, {
        items: [{ name: 'Board game' }],
      });

      const res = await authedGet<WishlistResponse>(
        app,
        wishlistUrl(room._id, user._id.toString()),
        token,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        userId: user._id.toString(),
        roomId: room._id,
        items: [expect.objectContaining({ name: 'Board game' })],
      });
    });

    it('should return 404 when no wishlist exists for that user and room', async () => {
      const { user, token } = await seedUser();
      const room = await createRoom(token);

      const res = await authedGet(
        app,
        wishlistUrl(room._id, user._id.toString()),
        token,
      );

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 when no token is provided', async () => {
      const { token } = await seedUser();
      const room = await createRoom(token);

      const res = await get(
        app,
        wishlistUrl(room._id, new Types.ObjectId().toString()),
      );

      expect(res).toBeUnauthorized();
    });
  });
});
