import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';

describe('RoomsController (e2e)', () => {
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

  describe('POST /rooms', () => {
    test('creates a room and returns 201 with the full shape', async () => {
      const ownerId = randomUUID();

      const res = await post('/rooms', {
        name: 'Test Room',
        ownerId: ownerId,
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({
        id: expect.any(String),
        name: 'Test Room',
        ownerId: ownerId,
        code: expect.stringMatching(/^[A-Z0-9]{6}$/),
        members: [ownerId],
        createdAt: expect.any(String),
      });
    });
  });

  describe('POST /rooms - validation', () => {
    test('returns 400 when name is too short', async () => {
      const res = await post('/rooms', { name: 'AB', ownerId: randomUUID() });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when ownerId is not UUID', async () => {
      const res = await post('/rooms', {
        name: 'Test Party',
        ownerId: 'owner-id',
      });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when unkknown field is set', async () => {
      const res = await post('/rooms', {
        name: 'Test Party',
        ownerId: randomUUID(),
        isAdminRoom: true,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /rooms', () => {
    const ownerId1 = randomUUID();
    const ownerId2 = randomUUID();

    test('returns 200 with an empty array when no rooms exist', async () => {
      const res = await get('/rooms');

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    test('returns every created room', async () => {
      const ownerId1 = randomUUID();
      const ownerId2 = randomUUID();

      await post('/rooms', { name: 'Room A', ownerId: ownerId1 });
      await post('/rooms', { name: 'Room B', ownerId: ownerId2 });

      const res = await get('/rooms');

      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(2);
    });
  });

  describe('GET /rooms/:id', () => {
    const ownerId = randomUUID();

    test('returns 200 with the room when it exists', async () => {
      const created = (
        await post('/rooms', { name: 'Room A', ownerId: ownerId })
      ).json();

      const res = await get(`/rooms/${created.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        id: created.id,
        name: 'Room A',
        ownerId: ownerId,
      });
    });

    test('returns 404 when the room does not exist', async () => {
      const res = await get(`/rooms/${randomUUID()}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /rooms/:code/join', () => {
    test('returns 200 (not 201) and adds the member', async () => {
      const ownerId = randomUUID();
      const userId = randomUUID();
      const created = (
        await post('/rooms', { name: 'Room A', ownerId })
      ).json();

      const res = await post(`/rooms/${created.code}/join`, { userId });

      expect(res.statusCode).toBe(200);
      expect(res.json().members).toEqual([ownerId, userId]);
    });

    test('is idempotent — joining twice does not duplicate', async () => {
      const ownerId = randomUUID();
      const userId = randomUUID();
      const created = (
        await post('/rooms', { name: 'Room A', ownerId })
      ).json();

      await post(`/rooms/${created.code}/join`, { userId });
      const res = await post(`/rooms/${created.code}/join`, { userId });

      expect(res.statusCode).toBe(200);
      expect(res.json().members).toEqual([ownerId, userId]);
    });

    test('returns 404 with the error envelope when no room has that code', async () => {
      const userId = randomUUID();
      const res = await post('/rooms/ZZZZZZ/join', { userId });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('ZZZZZZ'),
        timestamp: expect.any(String),
      });
    });
  });

  test('returns 400 when userId is not UUID', async () => {
    const createRes = await post('/rooms', {
      name: 'Valid Name',
      ownerId: randomUUID(),
    });
    const created = createRes.json();

    const res = await post(`/rooms/${created.code}/join`, {
      userId: 'not-a-uuid',
    });

    expect(res.statusCode).toBe(400);
  });
});
