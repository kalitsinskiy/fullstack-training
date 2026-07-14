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

  it.todo(
    'POST /api/rooms/:id/draw → creator-only; assigns everyone a giftee (nobody themselves)',
  );
  it.todo('POST /api/rooms/:id/draw → 403 for a non-creator');
  it.todo(
    'GET /api/rooms/:id/assignment → returns the giftee + wishlist after the draw',
  );

  // 👇 Lesson 04 — Authorization: roles & permissions.
  // Gate by PERMISSION, never by role. A missing permission → 403; a non-member → 404.
  it.todo('room response includes viewerPermissions for the caller');
  it.todo('owner can run the draw (POST /api/rooms/:id/draw → 200)');
  it.todo('member running the draw is rejected (POST /api/rooms/:id/draw → 403)');
  it.todo('owner can edit the room (PATCH /api/rooms/:id → 200)');
  it.todo('member editing the room is rejected (PATCH /api/rooms/:id → 403)');
  it.todo('owner can delete the room (DELETE /api/rooms/:id → 204)');
  it.todo('member deleting the room is rejected (DELETE /api/rooms/:id → 403)');
  it.todo(
    'owner can kick a member (DELETE /api/rooms/:id/members/:userId → 204)',
  );
  it.todo(
    'member cannot kick anyone (DELETE /api/rooms/:id/members/:userId → 403)',
  );
  it.todo(
    'kicking the owner is rejected (DELETE /api/rooms/:id/members/:ownerId → 400)',
  );
  it.todo(
    'owner can regenerate the invite code (POST /api/rooms/:id/invite-code/regenerate → 200)',
  );
  it.todo('member cannot regenerate the invite code (→ 403)');
  it.todo('a non-member gets 404 on any guarded room route');
  it.todo('a member can still GET /api/rooms/:id and PUT the wishlist');
});
