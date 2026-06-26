import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

/**
 * COMPONENT TEST (HTTP slice) for Rooms. Same approach as auth.e2e-spec.ts.
 *
 * For the authenticated scenarios below you'll want a logged-in user. Two
 * provided helpers make that easy (import them when you implement the todos):
 *   - `userFixture` / `roomFixture` from './factories' — seed the DB directly.
 *   - `tokenFor(jwtService, user)` from './auth-token.helper' — mint a JWT.
 * Grab the models/JwtService from the app, e.g.
 *   const userModel = app.get(getModelToken(User.name));
 *   const jwt = app.get(JwtService);
 * then `Authorization: Bearer ${token}` on the request.
 */
describe('Rooms (HTTP)', () => {
  let app: NestFastifyApplication;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalMongoUrl = process.env.MONGO_URL;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
    process.env.MONGO_URL = await startInMemoryMongo();
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    if (app) {
      const connection = app.get<Connection>(getConnectionToken());
      await clearAllCollections(connection);
      await app.close();
    }
  });

  afterAll(async () => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    if (originalMongoUrl === undefined) {
      delete process.env.MONGO_URL;
    } else {
      process.env.MONGO_URL = originalMongoUrl;
    }
    await stopInMemoryMongo();
  });

  // ✅ WORKED EXAMPLE — green against the skeleton: the JWT guard rejects the
  // request before RoomsService runs. Implement the service, then fill in below.
  it('POST /api/rooms → 401 without a token', async () => {
    await request(app.getHttpServer())
      .post('/api/rooms')
      .send({ name: 'Office Secret Santa' })
      .expect(401);
  });

  // --- helpers (DB is cleared between tests, so fixed emails are safe) ---
  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
  const EXCHANGE = '2026-12-24';

  async function reg(email: string) {
    const r = await http()
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd!', displayName: email.split('@')[0] })
      .expect(201);
    return { token: r.body.accessToken as string, id: r.body.id as string };
  }
  async function createRoom(token: string, name = 'Office Secret Santa') {
    return (
      await http()
        .post('/api/rooms')
        .set(bearer(token))
        .send({ name })
        .expect(201)
    ).body;
  }
  const joinById = (token: string, id: string, code: string) =>
    http()
      .post(`/api/rooms/${id}/join`)
      .set(bearer(token))
      .send({ inviteCode: code });

  // A room with 3 members (alice = owner). Ready for the draw.
  async function seedRoom() {
    const alice = await reg('alice@t.com');
    const bob = await reg('bob@t.com');
    const carol = await reg('carol@t.com');
    const room = await createRoom(alice.token);
    await joinById(bob.token, room.id, room.inviteCode).expect(201);
    await joinById(carol.token, room.id, room.inviteCode).expect(201);
    return { room, alice, bob, carol };
  }

  it('POST /api/rooms → 201 returns a room for an authenticated user', async () => {
    const alice = await reg('alice@t.com');
    const res = await http()
      .post('/api/rooms')
      .set(bearer(alice.token))
      .send({ name: 'Office Secret Santa' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Office Secret Santa');
    expect(res.body.inviteCode).toBeDefined();
    expect(res.body.status).toBe('pending');
  });

  it("GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated", async () => {
    const alice = await reg('alice@t.com');
    for (const n of ['A', 'B', 'C']) await createRoom(alice.token, `Room ${n}`);
    const res = await http()
      .get('/api/rooms?page=1&limit=2')
      .set(bearer(alice.token))
      .expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
  });

  it('GET /api/rooms/:id → 404 for a user who is not a member', async () => {
    const alice = await reg('alice@t.com');
    const outsider = await reg('outsider@t.com');
    const room = await createRoom(alice.token);
    await http()
      .get(`/api/rooms/${room.id}`)
      .set(bearer(outsider.token))
      .expect(404);
  });

  it('POST /api/rooms/:id/join → adds the caller when the invite code matches', async () => {
    const alice = await reg('alice@t.com');
    const bob = await reg('bob@t.com');
    const room = await createRoom(alice.token);
    const res = await joinById(bob.token, room.id, room.inviteCode).expect(201);
    expect(
      res.body.participants.some((p: { id: string }) => p.id === bob.id),
    ).toBe(true);
  });

  it('POST /api/rooms/:id/join → 400 on a wrong invite code', async () => {
    const alice = await reg('alice@t.com');
    const bob = await reg('bob@t.com');
    const room = await createRoom(alice.token);
    await joinById(bob.token, room.id, 'WRONG1').expect(400);
  });

  it('POST /api/rooms/:id/draw → creator-only; assigns everyone a giftee (nobody themselves)', async () => {
    const { room, alice, bob, carol } = await seedRoom();
    const res = await http()
      .post(`/api/rooms/${room.id}/draw`)
      .set(bearer(alice.token))
      .send({ exchangeDate: EXCHANGE })
      .expect(200);
    expect(res.body.status).toBe('drawn');
    for (const u of [alice, bob, carol]) {
      const a = await http()
        .get(`/api/rooms/${room.id}/assignment`)
        .set(bearer(u.token))
        .expect(200);
      expect(a.body.receiver.id).not.toBe(u.id); // never your own giftee
    }
  });

  it('POST /api/rooms/:id/draw → 403 for a non-creator', async () => {
    const { room, bob } = await seedRoom();
    await http()
      .post(`/api/rooms/${room.id}/draw`)
      .set(bearer(bob.token))
      .send({ exchangeDate: EXCHANGE })
      .expect(403);
  });

  it('GET /api/rooms/:id/assignment → returns the giftee + wishlist after the draw', async () => {
    const { room, alice } = await seedRoom();
    await http()
      .post(`/api/rooms/${room.id}/draw`)
      .set(bearer(alice.token))
      .send({ exchangeDate: EXCHANGE })
      .expect(200);
    const a = await http()
      .get(`/api/rooms/${room.id}/assignment`)
      .set(bearer(alice.token))
      .expect(200);
    expect(a.body.receiver.id).toBeDefined();
    expect(a.body.receiver.displayName).toBeDefined();
    expect(Array.isArray(a.body.receiver.wishlist)).toBe(true);
  });

  // --- Lesson 04: gate by PERMISSION; missing permission → 403, non-member → 404 ---

  it('room response includes viewerPermissions for the caller', async () => {
    const alice = await reg('alice@t.com');
    const room = await createRoom(alice.token);
    const res = await http()
      .get(`/api/rooms/${room.id}`)
      .set(bearer(alice.token))
      .expect(200);
    expect(Array.isArray(res.body.viewerPermissions)).toBe(true);
    expect(res.body.viewerPermissions).toContain('room:draw'); // owner has it
  });

  it('owner can edit the room (PATCH → 200); member is rejected (→ 403)', async () => {
    const { room, alice, bob } = await seedRoom();
    await http()
      .patch(`/api/rooms/${room.id}`)
      .set(bearer(alice.token))
      .send({ name: 'Renamed' })
      .expect(200);
    await http()
      .patch(`/api/rooms/${room.id}`)
      .set(bearer(bob.token))
      .send({ name: 'Nope' })
      .expect(403);
  });

  it('owner can delete the room (→ 204); member is rejected (→ 403)', async () => {
    const { room, alice, bob } = await seedRoom();
    await http()
      .delete(`/api/rooms/${room.id}`)
      .set(bearer(bob.token))
      .expect(403);
    await http()
      .delete(`/api/rooms/${room.id}`)
      .set(bearer(alice.token))
      .expect(204);
  });

  it('owner can kick a member (→ 204); member cannot (→ 403); kicking the owner → 400', async () => {
    const { room, alice, bob, carol } = await seedRoom();
    await http()
      .delete(`/api/rooms/${room.id}/members/${carol.id}`)
      .set(bearer(bob.token))
      .expect(403);
    await http()
      .delete(`/api/rooms/${room.id}/members/${alice.id}`)
      .set(bearer(alice.token))
      .expect(400);
    await http()
      .delete(`/api/rooms/${room.id}/members/${bob.id}`)
      .set(bearer(alice.token))
      .expect(204);
  });

  it('owner can regenerate the invite code (→ 200); member cannot (→ 403)', async () => {
    const { room, alice, bob } = await seedRoom();
    await http()
      .post(`/api/rooms/${room.id}/invite-code/regenerate`)
      .set(bearer(bob.token))
      .expect(403);
    await http()
      .post(`/api/rooms/${room.id}/invite-code/regenerate`)
      .set(bearer(alice.token))
      .expect(200);
  });

  it('a non-member gets 404 on a guarded room route', async () => {
    const alice = await reg('alice@t.com');
    const outsider = await reg('outsider@t.com');
    const room = await createRoom(alice.token);
    await http()
      .patch(`/api/rooms/${room.id}`)
      .set(bearer(outsider.token))
      .send({ name: 'x' })
      .expect(404);
  });

  it('a member can GET /api/rooms/:id and PUT the wishlist', async () => {
    const { room, bob } = await seedRoom();
    await http()
      .get(`/api/rooms/${room.id}`)
      .set(bearer(bob.token))
      .expect(200);
    await http()
      .put(`/api/rooms/${room.id}/wishlist`)
      .set(bearer(bob.token))
      .send({ items: ['Wool socks', 'A good book'] })
      .expect(200);
  });
});
