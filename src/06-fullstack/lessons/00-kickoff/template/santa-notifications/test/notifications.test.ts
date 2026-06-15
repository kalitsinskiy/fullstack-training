import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

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

  // 👇 Cover the notification routes the same way.
  it.todo(
    'GET /api/notifications?userId=… → returns that user\'s notifications, newest first',
  );
  it.todo(
    'POST /api/notifications → 201 creates a notification; 400 on an invalid body',
  );
  it.todo('GET /api/notifications/:id → 404 when it does not exist');
  it.todo('PATCH /api/notifications/:id/read → marks the notification read');
  it.todo('DELETE /api/notifications/:id → 204, then 404 on a second delete');
});
