jest.mock('ioredis', () => require('ioredis-mock'));

import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { buildApp } from '../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';
import { NotificationModel } from '../src/models/notification';

/**
 * COMPONENT TEST (Fastify) — the notifications counterpart of santa-api's
 * HTTP tests. Same idea, Fastify flavour: build the real app, drive it with
 * Fastify's built-in `app.inject()` (no network, no supertest), against an
 * in-memory MongoDB. A request runs through the real schema validation,
 * route handlers and Mongoose models.
 *
 * One worked example below is green out of the box. Turn each `it.todo` into a
 * real test the same way: `app.inject({ method, url, payload })` then assert
 * `res.statusCode` and `res.json()`.
 */
const alice = new Types.ObjectId().toString();
const alex = new Types.ObjectId().toString();

function tokenFor(app: FastifyInstance, sub: string): string {
  return app.jwt.sign({ sub, email: 'example@test.com', role: 'user' });
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

  it('GET /health → 200 { status: "ok" }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /api/notifications (JWT-scoped)', () => {
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
    await app.redis.quit();
    await app.close();
  });

  it('401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/notifications' });

    expect(res.statusCode).toBe(401);
  });

  it("returns only the caller's notifications + unreadCount", async () => {
    await NotificationModel.create([
      { userId: alice, roomId: alice, type: 'draw.completed', message: 'a', read: false },
      { userId: alice, roomId: alice, type: 'user.joined', message: 'b', read: true },
      { userId: alex, roomId: alex, type: 'draw.completed', message: 'c', read: false },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.data).toHaveLength(2);
    expect(body.unreadCount).toBe(1);
  });

  it("PATCH /:id/read -> 404 for another user's notification", async () => {
    const notification = await NotificationModel.create({
      userId: alex,
      roomId: alex,
      type: 'draw.completed',
      message: 'x',
      read: false,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${notification._id.toString()}/read`,
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('PATCH /:id/read -> 200 flips read, persists it and drops unreadCount', async () => {
    const notification = await NotificationModel.create({
      userId: alice,
      roomId: alice,
      type: 'draw.completed',
      message: 'The draw for "Office Party" is complete!',
      read: false,
    });

    const id = notification._id.toString();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${id}/read`,
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id, read: true });

    const stored = await NotificationModel.findById(id).lean();
    expect(stored?.read).toBe(true);

    const list = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });

    expect(list.json().unreadCount).toBe(0);
  });

  it('paginates: 25 notification ->  page_1 has 20, page_2 has 5', async () => {
    const base = new Date('2026-01-01T00:00:00.000Z').getTime();

    await NotificationModel.insertMany(
      Array.from({ length: 25 }, (_, i) => ({
        userId: alice,
        roomId: alice,
        type: 'user.joined' as const,
        message: `notification ${i}`,
        read: false,
        createdAt: new Date(base + i * 1_000),
      }))
    );

    const fetchPage = async (page: number) => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications?page=${page}`,
        headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
      });

      expect(res.statusCode).toBe(200);

      return res.json();
    };

    const first = await fetchPage(1);
    const second = await fetchPage(2);

    expect(first.data).toHaveLength(20);
    expect(second.data).toHaveLength(5);

    expect(first.total).toBe(25);
    expect(second.total).toBe(25);
    expect(first.limit).toBe(20);
    expect(second.page).toBe(2);

    expect(first.data[0].message).toBe('notification 24');
    expect(second.data[4].message).toBe('notification 0');

    const ids = new Set([...first.data, ...second.data].map((n) => n.id));
    expect(ids.size).toBe(25);
  });

  it('rejects an out-of-range limit (schema: maximum 100)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications?limit=500',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });

    expect(res.statusCode).toBe(400);
  });
});
