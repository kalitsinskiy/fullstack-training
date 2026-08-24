import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

const JWT_SECRET = 'test-jwt-secret';

function makeToken(userId: string): string {
  return jwt.sign({ sub: userId, email: 'test@example.com', role: 'user' }, JWT_SECRET);
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${makeToken(userId)}` };
}

describe('santa-notifications (HTTP)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.RABBITMQ_URL = ''; // disable RabbitMQ consumer in tests
    await setupTestDb();
  }, 300_000); // allow time for first-run MongoDB binary download

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    // Ensure env is set before buildApp() so the config plugin sees it.
    process.env.JWT_SECRET = JWT_SECRET;
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ✅ WORKED EXAMPLE
  it('GET /health → 200 { status: "ok" }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  // ---------------------------------------------------------------------------
  // GET /api/notifications
  // ---------------------------------------------------------------------------
  describe('GET /api/notifications', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/notifications' });
      expect(res.statusCode).toBe(401);
    });

    it("returns only the authenticated user's notifications, newest first", async () => {
      const userId = new Types.ObjectId();
      const otherId = new Types.ObjectId();

      await NotificationModel.create([
        { userId, type: 'user.joined', message: 'Alice joined', createdAt: new Date('2024-01-01') },
        { userId, type: 'draw.completed', message: 'Draw done', createdAt: new Date('2024-01-02') },
        {
          userId: otherId,
          type: 'room.created',
          message: 'Other user',
          createdAt: new Date('2024-01-03'),
        },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.total).toBe(2);
      expect(body.data).toHaveLength(2);
      // newest first
      expect(body.data[0].type).toBe('draw.completed');
      expect(body.data[1].type).toBe('user.joined');
      // no other user's data leaked
      body.data.forEach((n: { userId: string }) => expect(n.userId).toBe(userId.toString()));
    });

    it('returns unreadCount reflecting only unread notifications', async () => {
      const userId = new Types.ObjectId();

      await NotificationModel.create([
        { userId, type: 'user.joined', message: 'A', read: false },
        { userId, type: 'draw.completed', message: 'B', read: true },
        { userId, type: 'wishlist.updated', message: 'C', read: false },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.total).toBe(3);
      expect(body.unreadCount).toBe(2);
    });

    it('returns empty data and zero counts for a user with no notifications', async () => {
      const userId = new Types.ObjectId();

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ data: [], total: 0, unreadCount: 0 });
    });

    it('respects page and limit query params', async () => {
      const userId = new Types.ObjectId();

      await NotificationModel.insertMany(
        Array.from({ length: 5 }, (_, i) => ({
          userId,
          type: 'user.joined',
          message: `msg ${i}`,
          createdAt: new Date(Date.now() + i * 1000),
        }))
      );

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications?page=2&limit=2',
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      expect(body.page).toBe(2);
      expect(body.limit).toBe(2);
      expect(body.total).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/notifications/:id
  // ---------------------------------------------------------------------------
  describe('GET /api/notifications/:id', () => {
    it('returns 401 without a token', async () => {
      const id = new Types.ObjectId().toString();
      const res = await app.inject({ method: 'GET', url: `/api/notifications/${id}` });
      expect(res.statusCode).toBe(401);
    });

    it('returns the notification for its owner', async () => {
      const userId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId,
        type: 'draw.completed',
        message: 'Draw done!',
        roomId: 'room-1',
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ type: 'draw.completed', message: 'Draw done!' });
    });

    it('returns 404 when the notification belongs to another user', async () => {
      const ownerId = new Types.ObjectId();
      const requesterId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId: ownerId,
        type: 'draw.completed',
        message: 'Draw done!',
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(requesterId.toString()),
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 404 for a non-existent id', async () => {
      const userId = new Types.ObjectId();
      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications/${new Types.ObjectId()}`,
        headers: authHeader(userId.toString()),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/notifications/:id/read
  // ---------------------------------------------------------------------------
  describe('PATCH /api/notifications/:id/read', () => {
    it('returns 401 without a token', async () => {
      const id = new Types.ObjectId().toString();
      const res = await app.inject({ method: 'PATCH', url: `/api/notifications/${id}/read` });
      expect(res.statusCode).toBe(401);
    });

    it('marks a notification as read and returns it', async () => {
      const userId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId,
        type: 'user.joined',
        message: 'Someone joined',
        read: false,
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${doc._id}/read`,
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ read: true });

      const updated = await NotificationModel.findById(doc._id).lean();
      expect(updated?.read).toBe(true);
    });

    it("returns 404 when trying to mark another user's notification as read", async () => {
      const ownerId = new Types.ObjectId();
      const requesterId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId: ownerId,
        type: 'user.joined',
        message: 'Someone joined',
        read: false,
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${doc._id}/read`,
        headers: authHeader(requesterId.toString()),
      });

      expect(res.statusCode).toBe(404);
      // original notification must remain unread
      const unchanged = await NotificationModel.findById(doc._id).lean();
      expect(unchanged?.read).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/notifications/read-all
  // ---------------------------------------------------------------------------
  describe('PATCH /api/notifications/read-all', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/notifications/read-all' });
      expect(res.statusCode).toBe(401);
    });

    it('marks all unread notifications as read for the authenticated user only', async () => {
      const userId = new Types.ObjectId();
      const otherId = new Types.ObjectId();

      await NotificationModel.create([
        { userId, type: 'user.joined', message: 'A', read: false },
        { userId, type: 'draw.completed', message: 'B', read: false },
        { userId: otherId, type: 'user.joined', message: 'C', read: false },
      ]);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/notifications/read-all',
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true });

      const userNotifs = await NotificationModel.find({ userId }).lean();
      userNotifs.forEach((n) => expect(n.read).toBe(true));

      // other user's notification must be untouched
      const otherNotifs = await NotificationModel.find({ userId: otherId }).lean();
      otherNotifs.forEach((n) => expect(n.read).toBe(false));
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/notifications/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /api/notifications/:id', () => {
    it('returns 401 without a token', async () => {
      const id = new Types.ObjectId().toString();
      const res = await app.inject({ method: 'DELETE', url: `/api/notifications/${id}` });
      expect(res.statusCode).toBe(401);
    });

    it('deletes the notification and returns 204', async () => {
      const userId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId,
        type: 'draw.completed',
        message: 'Draw done',
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(204);
      expect(await NotificationModel.findById(doc._id)).toBeNull();
    });

    it('returns 404 on a second delete (already gone)', async () => {
      const userId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId,
        type: 'draw.completed',
        message: 'Draw done',
      });

      await app.inject({
        method: 'DELETE',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(userId.toString()),
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(userId.toString()),
      });

      expect(res.statusCode).toBe(404);
    });

    it("returns 404 when trying to delete another user's notification", async () => {
      const ownerId = new Types.ObjectId();
      const requesterId = new Types.ObjectId();
      const doc = await NotificationModel.create({
        userId: ownerId,
        type: 'draw.completed',
        message: 'Draw done',
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/notifications/${doc._id}`,
        headers: authHeader(requesterId.toString()),
      });

      expect(res.statusCode).toBe(404);
      expect(await NotificationModel.findById(doc._id)).not.toBeNull();
    });
  });
});
