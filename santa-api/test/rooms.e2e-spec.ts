import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection, Model } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User } from '../src/users/schemas/user.schema';
import { tokenFor } from './auth-token.helper';
import { userFixture } from './factories';
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

  async function seedUserWithToken(overrides: Record<string, unknown> = {}) {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture(overrides));
    return { user, token: tokenFor(jwt, user) };
  }

  // ✅ WORKED EXAMPLE — green against the skeleton: the JWT guard rejects the
  // request before RoomsService runs. Implement the service, then fill in below.
  it('POST /api/rooms → 401 without a token', async () => {
    await request(app.getHttpServer())
      .post('/api/rooms')
      .send({ name: 'Office Secret Santa' })
      .expect(401);
  });

  it('POST /api/rooms → 201 returns a room for an authenticated user', async () => {
    const { user, token } = await seedUserWithToken({ displayName: 'Owner' });

    const response = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Office Secret Santa', budget: 500, currency: '₴' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Office Secret Santa',
      creatorId: user._id.toString(),
      status: 'pending',
      participantCount: 1,
      budget: 500,
      currency: '₴',
    });
    expect(typeof response.body.id).toBe('string');
    expect(response.body.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(response.body.participants).toEqual([
      { id: user._id.toString(), displayName: 'Owner', role: 'owner' },
    ]);

    expect(response.body.viewerPermissions).toEqual(
      expect.arrayContaining(['room:view', 'room:draw', 'wishlist:set']),
    );
  });

  it.todo(
    'POST /api/rooms → 409 when the SAME creator reuses a room name (stretch); a different user may reuse it',
  );

  it("GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated", async () => {
    const { token } = await seedUserWithToken();

    for (const name of ['Room A', 'Room B', 'Room C']) {
      await request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name })
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
  });

  it('GET /api/rooms/:id → 404 for a user who is not a member', async () => {
    const { token: ownerToken } = await seedUserWithToken();
    const { token: outsiderToken } = await seedUserWithToken();

    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private Room' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
  });

  it('POST /api/rooms/:id/join → adds the caller when the invite code matches', async () => {
    const { token: ownerToken } = await seedUserWithToken();
    const { user: joiner, token: joinerToken } = await seedUserWithToken({
      displayName: 'Joiner',
    });

    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Joinable Room' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${created.body.id}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ inviteCode: created.body.inviteCode })
      .expect(201);

    expect(response.body.participantCount).toBe(2);
    expect(response.body.participants).toContainEqual({
      id: joiner._id.toString(),
      displayName: 'Joiner',
      role: 'member',
    });

    expect(response.body.viewerPermissions).toEqual(
      expect.arrayContaining(['room:view', 'wishlist:set']),
    );
    expect(response.body.viewerPermissions).not.toContain('room:draw');
  });

  it('POST /api/rooms/:id/join → 400 on a wrong invite code', async () => {
    const { token: ownerToken } = await seedUserWithToken();
    const { token: joinerToken } = await seedUserWithToken();

    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Guarded Room' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/rooms/${created.body.id}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ inviteCode: 'WRONG1' })
      .expect(400);
  });

  // Create a room owned by `ownerToken` and have `memberTokens` join it.
  async function seedRoomWithMembers(count: number) {
    const { user: owner, token: ownerToken } = await seedUserWithToken({
      displayName: 'Owner',
    });

    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Draw Room' })
      .expect(201);

    const members: { id: string; token: string }[] = [];
    for (let i = 0; i < count; i += 1) {
      const { user, token } = await seedUserWithToken({
        displayName: `Member ${i + 1}`,
      });
      await request(app.getHttpServer())
        .post(`/api/rooms/${created.body.id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({ inviteCode: created.body.inviteCode })
        .expect(201);
      members.push({ id: user._id.toString(), token });
    }

    return {
      roomId: created.body.id as string,
      owner: { id: owner._id.toString(), token: ownerToken },
      members,
    };
  }

  it('POST /api/rooms/:id/draw → creator-only; assigns everyone a giftee (nobody themselves)', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(2);
    const everyone = [owner, ...members];

    const drawn = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    expect(drawn.body.status).toBe('drawn');
    expect(drawn.body.exchangeDate).toContain('2026-12-24');

    // Every participant has exactly one giftee, nobody draws themselves, and no
    // two people share the same giftee.
    const receivers = new Set<string>();
    for (const person of everyone) {
      const res = await request(app.getHttpServer())
        .get(`/api/rooms/${roomId}/assignment`)
        .set('Authorization', `Bearer ${person.token}`)
        .expect(200);
      expect(res.body.receiver.id).not.toBe(person.id);
      receivers.add(res.body.receiver.id);
    }
    expect(receivers.size).toBe(everyone.length);

    // Idempotency: a second draw is rejected.
    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(400);
  });

  it('POST /api/rooms/:id/draw → 403 for a non-creator', async () => {
    const { roomId, members } = await seedRoomWithMembers(2);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('POST /api/rooms/:id/draw → 400 with fewer than 3 participants', async () => {
    const { roomId, owner } = await seedRoomWithMembers(1);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(400);
  });

  it('GET /api/rooms/:id/assignment → returns the giftee + wishlist after the draw', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(2);

    // Everyone sets a wishlist so whoever the owner draws has items to show.
    for (const person of [owner, ...members]) {
      await request(app.getHttpServer())
        .put(`/api/rooms/${roomId}/wishlist`)
        .set('Authorization', `Bearer ${person.token}`)
        .send({ items: ['Wool socks', 'A good book'] })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/assignment`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(res.body.receiver).toEqual({
      id: expect.any(String),
      displayName: expect.any(String),
      wishlist: ['Wool socks', 'A good book'],
    });
    expect(res.body.receiver.id).not.toBe(owner.id);
  });

  it('GET /api/rooms/:id/assignment → 400 before the draw', async () => {
    const { roomId, owner } = await seedRoomWithMembers(2);

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/assignment`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(400);
  });

  // 👇 Lesson 04 — Authorization: roles & permissions.
  // Gate by PERMISSION, never by role. A missing permission → 403; a non-member → 404.
  it('room response includes viewerPermissions for the caller', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(1);

    const ownerView = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(ownerView.body.viewerPermissions).toEqual(
      expect.arrayContaining(['room:draw', 'room:edit', 'room:delete', 'room:kick']),
    );

    const memberView = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(200);
    expect(memberView.body.viewerPermissions).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('owner can run the draw; a member is rejected with 403', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(2);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);
  });

  it('owner can edit the room; a member is rejected with 403', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(1);

    await request(app.getHttpServer())
      .patch(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .send({ name: 'Hijacked' })
      .expect(403);

    const edited = await request(app.getHttpServer())
      .patch(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Renamed Room' })
      .expect(200);
    expect(edited.body.name).toBe('Renamed Room');
  });

  it('owner can delete the room; a member is rejected with 403', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(1);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(404);
  });

  it('owner can kick a member; kicking the owner is 400; a member cannot kick', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(2);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${roomId}/members/${members[1].id}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${roomId}/members/${owner.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${roomId}/members/${members[0].id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(204);

    const after = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(after.body.participantCount).toBe(2);
    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(404);
  });

  it('owner can regenerate the invite code; a member is rejected with 403', async () => {
    const { roomId, owner, members } = await seedRoomWithMembers(1);

    const before = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(403);

    const regenerated = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(regenerated.body.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(regenerated.body.inviteCode).not.toBe(before.body.inviteCode);
  });

  it('a non-member gets 404 on a guarded room route', async () => {
    const { roomId } = await seedRoomWithMembers(1);
    const { token: outsiderToken } = await seedUserWithToken();

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
  });

  it('a member can still GET the room and PUT their wishlist', async () => {
    const { roomId, members } = await seedRoomWithMembers(1);

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .set('Authorization', `Bearer ${members[0].token}`)
      .send({ items: ['Socks'] })
      .expect(200);
  });
});
