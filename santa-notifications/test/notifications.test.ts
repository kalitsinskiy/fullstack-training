import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { buildApp } from '../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

const JWT_SECRET = 'test-secret';
const SERVICE_KEY = 'test-service-key';
const userId = new Types.ObjectId().toString();
const tokenFor = (sub: string) => jwt.sign({ sub }, JWT_SECRET);
const svc = { 'x-service-key': SERVICE_KEY };
const sample = { userId, type: 'system', message: 'Hello there' };

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
describe('santa-notifications (HTTP)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // The routes are secured: caller JWT for reads, service key for create.
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.SERVICE_API_KEY = SERVICE_KEY;
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

  // ✅ WORKED EXAMPLE — health needs no DB state, so it's green immediately.
  it('GET /health → 200 { status: "ok" }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  // POST is service-to-service (the event consumer); reads are caller-scoped.
  const createFor = async (sub: string, message = 'Hello there') => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: svc,
      payload: { userId: sub, type: 'system', message },
    });
    return res.json() as { id: string };
  };

  it('GET /api/notifications → 401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/notifications' });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/notifications → returns the caller's notifications + unreadCount", async () => {
    await createFor(userId, 'first');
    await createFor(userId, 'second');
    await createFor(new Types.ObjectId().toString(), 'someone else'); // must not appear

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${tokenFor(userId)}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[]; unreadCount: number };
    expect(body.data).toHaveLength(2);
    expect(body.unreadCount).toBe(2);
  });

  it('POST /api/notifications → 201 with the service key; 401 without it; 400 on a bad body', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: svc,
      payload: sample,
    });
    expect(ok.statusCode).toBe(201);

    const noKey = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      payload: sample,
    });
    expect(noKey.statusCode).toBe(401);

    const badBody = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: svc,
      payload: { userId },
    });
    expect(badBody.statusCode).toBe(400);
  });

  it('GET /api/notifications/:id → 401 without a token', async () => {
    const { id } = await createFor(userId);
    const res = await app.inject({ method: 'GET', url: `/api/notifications/${id}` });
    expect(res.statusCode).toBe(401);
  });

  it('PATCH /api/notifications/:id/read → marks the caller’s notification read', async () => {
    const { id } = await createFor(userId);
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${id}/read`,
      headers: { authorization: `Bearer ${tokenFor(userId)}` },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { read: boolean }).read).toBe(true);
  });

  it('DELETE /api/notifications/:id → 204, then 404 on a second delete', async () => {
    const { id } = await createFor(userId);
    const auth = { authorization: `Bearer ${tokenFor(userId)}` };
    const first = await app.inject({ method: 'DELETE', url: `/api/notifications/${id}`, headers: auth });
    expect(first.statusCode).toBe(204);
    const second = await app.inject({ method: 'DELETE', url: `/api/notifications/${id}`, headers: auth });
    expect(second.statusCode).toBe(404);
  });
});
