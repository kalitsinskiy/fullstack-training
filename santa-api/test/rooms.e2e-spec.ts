import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User } from '../src/users/schemas/user.schema';
import { userFixture, roomFixture } from './factories';
import { tokenFor } from './auth-token.helper';
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

  // 👇 Implement RoomsService, then turn each of these into a real test.
  it('POST /api/rooms → 201 returns a room for an authenticated user', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture());
    const token = tokenFor(jwt, user);

    const response = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Office Santa' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Office Santa',
      creatorId: user._id.toString(),
      inviteCode: expect.any(String),
      status: 'pending',
      participantCount: 1,
    });
  });

  it('POST /api/rooms → 409 when the SAME creator reuses a room name (stretch); a different user may reuse it', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user1 = await userModel.create(userFixture());
    const user2 = await userModel.create(userFixture());
    const token1 = tokenFor(jwt, user1);
    const token2 = tokenFor(jwt, user2);

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Duplicate Name' })
      .expect(201);

    // Same creator reuses name -> 409
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Duplicate Name' })
      .expect(409);

    // Different user reuses name -> 201
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Duplicate Name' })
      .expect(201);
  });

  it("GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated", async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture());
    const token = tokenFor(jwt, user);

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Room 1' });
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Room 2' });

    const response = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 2,
    });
  });

  it('GET /api/rooms/:id → 404 for a user who is not a member', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user1 = await userModel.create(userFixture());
    const user2 = await userModel.create(userFixture());
    const token1 = tokenFor(jwt, user1);
    const token2 = tokenFor(jwt, user2);

    const roomRes = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Private Room' });

    const roomId = roomRes.body.id;

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);
  });

  it('POST /api/rooms/:id/join → adds the caller when the invite code matches', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const owner = await userModel.create(userFixture());
    const joiner = await userModel.create(userFixture());
    const tokenOwner = tokenFor(jwt, owner);
    const tokenJoiner = tokenFor(jwt, joiner);

    const createRes = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Party Room' });

    const roomId = createRes.body.id;
    const inviteCode = createRes.body.inviteCode;

    const joinRes = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${tokenJoiner}`)
      .send({ inviteCode })
      .expect(201);

    expect(joinRes.body.participantCount).toBe(2);
  });

  it('POST /api/rooms/:id/join → 400 on a wrong invite code', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const owner = await userModel.create(userFixture());
    const joiner = await userModel.create(userFixture());
    const tokenOwner = tokenFor(jwt, owner);
    const tokenJoiner = tokenFor(jwt, joiner);

    const createRes = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Secure Room' });

    const roomId = createRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${tokenJoiner}`)
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
