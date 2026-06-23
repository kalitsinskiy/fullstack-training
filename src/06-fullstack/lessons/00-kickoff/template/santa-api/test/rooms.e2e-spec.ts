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

  // 👇 Implement RoomsService, then turn each of these into a real test.
  it.todo('POST /api/rooms → 201 returns a room for an authenticated user');
  it.todo(
    'POST /api/rooms → 409 when the SAME creator reuses a room name (stretch); a different user may reuse it',
  );
  it.todo(
    "GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated",
  );
  it.todo('GET /api/rooms/:id → 404 for a user who is not a member');
  it.todo(
    'POST /api/rooms/:id/join → adds the caller when the invite code matches',
  );
  it.todo('POST /api/rooms/:id/join → 400 on a wrong invite code');
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
