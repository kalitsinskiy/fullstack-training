import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('WishlistController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (url: string, payload: unknown) =>
    app.getHttpAdapter().getInstance().inject({ method: 'POST', url, payload });

  const get = (url: string) =>
    app.getHttpAdapter().getInstance().inject({ method: 'GET', url });

  describe('POST /rooms/:roomId/wishlist', () => {
    test('returns 200 with the wishlist on first set', async () => {
      const roomId = randomUUID();
      const userId = randomUUID();

      const res = await post(`/rooms/${roomId}/wishlist`, {
        userId,
        items: ['hat', 'book', 'cup'],
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        roomId,
        userId,
        items: ['hat', 'book', 'cup'],
      });
    });

    test('overwrites a previous wishlist for the same user', async () => {
      const roomId = randomUUID();
      const userId = randomUUID();

      await post(`/rooms/${roomId}/wishlist`, { userId, items: ['old'] });
      const res = await post(`/rooms/${roomId}/wishlist`, {
        userId,
        items: ['new'],
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().items).toEqual(['new']);
    });
  });

  describe('POST /rooms/:roomId/wishlist — validation', () => {
    test('returns 400 when roomId in the path is not a UUID', async () => {
      const res = await post('/rooms/not-a-uuid/wishlist', {
        userId: randomUUID(),
        items: ['x'],
      });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when userId in the body is not a UUID', async () => {
      const res = await post(`/rooms/${randomUUID()}/wishlist`, {
        userId: 'not-a-uuid',
        items: ['x'],
      });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when items contains an empty string', async () => {
      const res = await post(`/rooms/${randomUUID()}/wishlist`, {
        userId: randomUUID(),
        items: ['ok', ''],
      });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when items is not an array', async () => {
      const res = await post(`/rooms/${randomUUID()}/wishlist`, {
        userId: randomUUID(),
        items: 'socks',
      });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when an unknown field is sent', async () => {
      const res = await post(`/rooms/${randomUUID()}/wishlist`, {
        userId: randomUUID(),
        items: ['x'],
        public: true,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /rooms/:roomId/wishlist/:userId', () => {
    test('returns 200 with the wishlist when one exists', async () => {
      const roomId = randomUUID();
      const userId = randomUUID();
      await post(`/rooms/${roomId}/wishlist`, { userId, items: ['mug'] });

      const res = await get(`/rooms/${roomId}/wishlist/${userId}`);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ roomId, userId, items: ['mug'] });
    });

    test('returns 404 with the error envelope when no wishlist exists', async () => {
      const res = await get(`/rooms/${randomUUID()}/wishlist/${randomUUID()}`);

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('not found'),
        timestamp: expect.any(String),
      });
    });

    test('returns 400 when roomId is not a UUID', async () => {
      const res = await get(`/rooms/not-a-uuid/wishlist/${randomUUID()}`);
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when userId is not a UUID', async () => {
      const res = await get(`/rooms/${randomUUID()}/wishlist/not-a-uuid`);
      expect(res.statusCode).toBe(400);
    });
  });
});
