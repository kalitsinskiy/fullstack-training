import { createHmac } from 'crypto';
import { Types } from 'mongoose';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

function makeToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? 'test-secret';
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, email: 'test@test.com', role: 'user', iat: now, exp: now + 3600 })).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

describe('santa-notifications (HTTP)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
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

  it("GET /api/notifications → returns the caller's notifications, newest first", async () => {
    const userId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    await NotificationModel.create([
      { userId, type: 'system', message: 'First', read: false, createdAt: new Date('2026-01-01') },
      { userId, type: 'system', message: 'Second', read: false, createdAt: new Date('2026-01-02') },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].message).toBe('Second');
    expect(body.data[1].message).toBe('First');
    expect(body.total).toBe(2);
    expect(body.unreadCount).toBe(2);
  });

  it('GET /api/notifications → 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/notifications' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/notifications → does not return another user\'s notifications', async () => {
    const userId = new Types.ObjectId();
    const otherUserId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    await NotificationModel.create([
      { userId, type: 'system', message: 'Mine', read: false },
      { userId: otherUserId, type: 'system', message: 'Not mine', read: false },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].message).toBe('Mine');
  });

  it('GET /api/notifications → pagination: page 1 returns limit items, page 2 returns the rest', async () => {
    const userId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    const docs = Array.from({ length: 25 }, (_, i) => ({
      userId,
      type: 'system' as const,
      message: `Notification ${i}`,
      read: false,
    }));
    await NotificationModel.create(docs);

    const page1 = await app.inject({
      method: 'GET',
      url: '/api/notifications?page=1&limit=20',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(page1.statusCode).toBe(200);
    expect(page1.json().data).toHaveLength(20);
    expect(page1.json().total).toBe(25);

    const page2 = await app.inject({
      method: 'GET',
      url: '/api/notifications?page=2&limit=20',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(page2.statusCode).toBe(200);
    expect(page2.json().data).toHaveLength(5);
  });

  it('PATCH /api/notifications/:id/read → marks the notification read', async () => {
    const userId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    const notification = await NotificationModel.create({
      userId,
      type: 'system',
      message: 'Hello',
      read: false,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${notification._id}/read`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.read).toBe(true);

    const updated = await NotificationModel.findById(notification._id);
    expect(updated!.read).toBe(true);
  });

  it('PATCH /api/notifications/:id/read → 404 for non-existent id', async () => {
    const userId = new Types.ObjectId();
    const token = makeToken(userId.toString());
    const fakeId = new Types.ObjectId();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${fakeId}/read`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it("PATCH /api/notifications/:id/read → 404 when trying to read another user's notification", async () => {
    const userId = new Types.ObjectId();
    const otherUserId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    const notification = await NotificationModel.create({
      userId: otherUserId,
      type: 'system',
      message: 'Not yours',
      read: false,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${notification._id}/read`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('PATCH /api/notifications/read-all → marks all unread notifications as read', async () => {
    const userId = new Types.ObjectId();
    const token = makeToken(userId.toString());

    await NotificationModel.create([
      { userId, type: 'system', message: 'One', read: false },
      { userId, type: 'system', message: 'Two', read: false },
    ]);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/notifications/read-all',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });

    const unread = await NotificationModel.countDocuments({ userId, read: false });
    expect(unread).toBe(0);
  });
});
