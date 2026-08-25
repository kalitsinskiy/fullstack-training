import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

/**
 * COMPONENT TEST (Fastify) — the notifications counterpart of santa-api's
 * HTTP tests. Same idea, Fastify flavour: build the real app, drive it with
 * Fastify's built-in `app.inject()` (no network, no supertest), against an
 * in-memory MongoDB. A request runs through the real schema validation,
 * route handlers and Mongoose models.
 */

const ALICE = '665f0c2ab7d13a5e8b1c4d01';
const BOB = '665f0c2ab7d13a5e8b1c4d02';
const ROOM_ID = '665f0c2ab7d13a5e8b1c4d9f';

const TEST_SERVICE_KEY = 'test-service-key';

interface NotificationListBody {
  data: { id: string; message: string; read: boolean }[];
  unreadCount: number;
}

function seed(userId: string, overrides: Record<string, unknown> = {}) {
  return NotificationModel.create({
    userId,
    roomId: ROOM_ID,
    type: 'draw.completed',
    message: 'The draw for "Office Party" is complete — check your giftee!',
    read: false,
    ...overrides,
  });
}

describe('santa-notifications (HTTP)', () => {
  let app: FastifyInstance;

  /** A token exactly as santa-api signs it: { sub, email, role }. */
  const bearer = (userId: string) =>
    `Bearer ${app.jwt.sign({ sub: userId, email: 'user@test.com', role: 'user' })}`;

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

  it('GET /users/online → 200 [] with nobody connected', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users/online',
      headers: { authorization: bearer(ALICE) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('GET /users/online → lists users marked online, deduplicated', async () => {
    await app.presence.markOnline('user-a');
    await app.presence.markOnline('user-b');

    await app.presence.markOnline('user-a');

    const res = await app.inject({
      method: 'GET',
      url: '/users/online',
      headers: { authorization: bearer(ALICE) },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as string[]).sort()).toEqual(['user-a', 'user-b']);

    await expect(app.presence.isOnline('user-a')).resolves.toBe(true);
    await expect(app.presence.countOnline()).resolves.toBe(2);

    await app.presence.markOffline('user-a');
    const after = await app.inject({
      method: 'GET',
      url: '/users/online',
      headers: { authorization: bearer(ALICE) },
    });
    expect(after.json()).toEqual(['user-b']);
  });

  describe('GET /api/notifications', () => {
    it('401s without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/notifications' });
      expect(res.statusCode).toBe(401);
    });

    it('401s when the signature does not match the shared secret', async () => {
      const valid = app.jwt.sign({ sub: ALICE, email: 'a@test.com', role: 'user' });
      const tampered = `${valid.slice(0, -4)}AAAA`;

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: { authorization: `Bearer ${tampered}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns only the caller's notifications, newest first, with an unread count", async () => {
      await seed(ALICE, { message: 'older', createdAt: new Date('2026-01-01') });
      await seed(ALICE, { message: 'newer', createdAt: new Date('2026-02-01'), read: true });
      await seed(BOB, { message: "bob's secret" });

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as NotificationListBody;
      expect(body.data.map((n) => n.message)).toEqual(['newer', 'older']);
      expect(body.unreadCount).toBe(1);
    });

    it('ignores a userId query param — the IDOR is closed', async () => {
      await seed(BOB);

      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications?userId=${BOB}`,
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(200);
      expect((res.json() as NotificationListBody).data).toEqual([]);
    });

    it('paginates with page and limit', async () => {
      for (let i = 0; i < 3; i += 1) {
        await seed(ALICE, { message: `n${i}`, createdAt: new Date(2026, 0, i + 1) });
      }

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications?page=2&limit=2',
        headers: { authorization: bearer(ALICE) },
      });

      const body = res.json() as NotificationListBody;
      expect(body.data.map((n) => n.message)).toEqual(['n0']);
      expect(body.unreadCount).toBe(3);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it("404s on another user's notification instead of leaking it", async () => {
      const bobs = await seed(BOB);

      const res = await app.inject({
        method: 'GET',
        url: `/api/notifications/${bobs._id.toString()}`,
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/notifications', () => {
    it('401s without the service key — a browser cannot forge one', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/notifications',
        headers: { authorization: bearer(ALICE) },
        payload: { userId: BOB, type: 'system', message: 'hi' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('201s with the service key', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/notifications',
        headers: { 'x-service-key': TEST_SERVICE_KEY },
        payload: { userId: ALICE, type: 'system', message: 'Welcome!' },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({ userId: ALICE, message: 'Welcome!', read: false });
    });

    it('400s on an invalid body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/notifications',
        headers: { 'x-service-key': TEST_SERVICE_KEY },
        payload: { userId: ALICE, type: 'not-a-type', message: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it("marks the caller's own notification read", async () => {
      const mine = await seed(ALICE);

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${mine._id.toString()}/read`,
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ read: true });
    });

    it("404s on someone else's notification and leaves it unread", async () => {
      const bobs = await seed(BOB);

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/notifications/${bobs._id.toString()}/read`,
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(404);
      await expect(NotificationModel.findById(bobs._id).exec()).resolves.toMatchObject({
        read: false,
      });
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('204s, then 404s on a second delete', async () => {
      const mine = await seed(ALICE);
      const url = `/api/notifications/${mine._id.toString()}`;
      const headers = { authorization: bearer(ALICE) };

      await expect(app.inject({ method: 'DELETE', url, headers })).resolves.toMatchObject({
        statusCode: 204,
      });
      await expect(app.inject({ method: 'DELETE', url, headers })).resolves.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
