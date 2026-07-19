import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User } from '../src/users/schemas/user.schema';
import { Room } from '../src/rooms/schemas/room.schema';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';
import { userFixture, roomFixture } from './factories';
import { tokenFor } from './auth-token.helper';

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

  it('POST /api/rooms → 201 returns a room for an authenticated user', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const token = tokenFor(jwt, owner);

    const res = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Office Secret Santa' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String) as string,
      name: 'Office Secret Santa',
      inviteCode: expect.any(String) as string,
      status: 'pending',
    });
    expect(res.body.inviteCode).toHaveLength(6);
  });

  it("GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated", async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const token = tokenFor(jwt, owner);

    await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/rooms/:id → 404 for a user who is not a member', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const stranger = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );

    const strangerToken = tokenFor(jwt, stranger);

    await request(app.getHttpServer())
      .get(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .expect(404);
  });

  it('POST /api/rooms/:id/join → adds the caller when the invite code matches', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const joiner = await userModel.create(userFixture());
    const inviteCode = 'JOIN99';
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        inviteCode,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );

    const joinerToken = tokenFor(jwt, joiner);

    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ inviteCode })
      .expect(201);

    expect(res.body.participantCount).toBe(2);
  });

  it('POST /api/rooms/:id/join → 400 on a wrong invite code', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const joiner = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        inviteCode: 'GOOD77',
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );

    const joinerToken = tokenFor(jwt, joiner);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ inviteCode: 'WRONG1' })
      .expect(400);
  });

  it('POST /api/rooms/:id/draw → assigns everyone a giftee (nobody themselves)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const m1 = await userModel.create(userFixture());
    const m2 = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: m1._id, role: 'member' },
          { userId: m2._id, role: 'member' },
        ],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    const updatedRoom = await roomModel.findById(room._id).lean();
    expect(updatedRoom!.status).toBe('drawn');
    expect(updatedRoom!.assignments).toHaveLength(3);
    for (const assignment of updatedRoom!.assignments) {
      expect(assignment.giverId.toString()).not.toBe(
        assignment.receiverId.toString(),
      );
    }
  });

  it('POST /api/rooms/:id/draw → 403 for a non-creator', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );

    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('GET /api/rooms/:id/assignment → returns the giftee + wishlist after the draw', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const m1 = await userModel.create(userFixture());
    const m2 = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: m1._id, role: 'member' },
          { userId: m2._id, role: 'member' },
        ],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exchangeDate: '2026-12-24' });

    const res = await request(app.getHttpServer())
      .get(`/api/rooms/${room._id}/assignment`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.receiver).toBeDefined();
    expect(res.body.receiver.displayName).toBeDefined();
    expect(res.body.receiver.wishlist).toBeDefined();
  });

  // 👇 Lesson 04 — Authorization: roles & permissions.
  // Gate by PERMISSION, never by role. A missing permission → 403; a non-member → 404.
  it('room response includes viewerPermissions for the caller', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const token = tokenFor(jwt, owner);

    const res = await request(app.getHttpServer())
      .get(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.viewerPermissions).toContain('room:draw');
    expect(res.body.viewerPermissions).toContain('room:delete');
  });

  it('owner can run the draw (POST /api/rooms/:id/draw → 200)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member1 = await userModel.create(userFixture());
    const member2 = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member1._id, role: 'member' },
          { userId: member2._id, role: 'member' },
        ],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);
  });

  it('member running the draw is rejected (POST /api/rooms/:id/draw → 403)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('owner can edit the room (PATCH /api/rooms/:id → 200)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .patch(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Room' })
      .expect(200);
  });

  it('member editing the room is rejected (PATCH /api/rooms/:id → 403)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .patch(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Updated Room' })
      .expect(403);
  });

  it('owner can delete the room (DELETE /api/rooms/:id → 204)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('member deleting the room is rejected (DELETE /api/rooms/:id → 403)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('owner can kick a member (DELETE /api/rooms/:id/members/:userId → 204)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id}/members/${member._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('member cannot kick anyone (DELETE /api/rooms/:id/members/:userId → 403)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member1 = await userModel.create(userFixture());
    const member2 = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member1._id, role: 'member' },
          { userId: member2._id, role: 'member' },
        ],
      }),
    );
    const member1Token = tokenFor(jwt, member1);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id}/members/${member2._id}`)
      .set('Authorization', `Bearer ${member1Token}`)
      .expect(403);
  });

  it('kicking the owner is rejected (DELETE /api/rooms/:id/members/:ownerId → 400)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const token = tokenFor(jwt, owner);

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id}/members/${owner._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('owner can regenerate the invite code (POST /api/rooms/:id/invite-code/regenerate → 200)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const oldCode = 'ABC123';
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        inviteCode: oldCode,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const token = tokenFor(jwt, owner);

    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.inviteCode).not.toBe(oldCode);
  });

  it('member cannot regenerate the invite code (→ 403)', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('a non-member gets 404 on any guarded room route', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const stranger = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [{ userId: owner._id, role: 'owner' }],
      }),
    );
    const strangerToken = tokenFor(jwt, stranger);

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id}/draw`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(404);
  });

  it('a member can still GET /api/rooms/:id and PUT the wishlist', async () => {
    const userModel = app.get(getModelToken(User.name));
    const roomModel = app.get(getModelToken(Room.name));
    const jwt = app.get(JwtService);

    const owner = await userModel.create(userFixture());
    const member = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      }),
    );
    const memberToken = tokenFor(jwt, member);

    await request(app.getHttpServer())
      .get(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/rooms/${room._id}/wishlist`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ items: ['item1', 'item2'] })
      .expect(200);
  });
});
