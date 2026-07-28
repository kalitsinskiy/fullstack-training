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
});
