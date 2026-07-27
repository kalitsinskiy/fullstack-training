import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/users/schemas/user.schema';
import { userFixture, roomFixture } from './factories';
import { Room } from '../src/rooms/schemas/room.schema';
import { Wishlist } from '../src/wishlist/schemas/wishlist.schema';
import { tokenFor } from './auth-token.helper';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

jest.mock('amqplib', () => {
  const publish = jest.fn();
  return {
    connect: jest.fn().mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue({
        assertExchange: jest.fn().mockResolvedValue(undefined),
        publish,
        close: jest.fn(),
      }),
      on: jest.fn(),
      close: jest.fn(),
    }),
  };
});

jest.mock('ioredis', () => require('ioredis-mock'));

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
    await app.get<Model<Room>>(getModelToken(Room.name)).syncIndexes();
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

  async function seedUser(overrides: Record<string, unknown> = {}) {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture(overrides));

    return { user, token: tokenFor(jwt, user) };
  }

  async function seedDrawableRoom() {
    const owner = await seedUser({ displayName: 'Alice' });
    const m1 = await seedUser({ displayName: 'Bob' });
    const m2 = await seedUser({ displayName: 'Alex' });
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user.id,
        participants: [
          { userId: owner.user._id, role: 'owner' },
          { userId: m1.user._id, role: 'member' },
          { userId: m2.user._id, role: 'member' },
        ],
      }),
    );

    return { owner, m1, m2, room, roomModel };
  }

  async function seedOwnerAndMember() {
    const owner = await seedUser({ displayName: 'Owner' });
    const member = await seedUser({ displayName: 'Member' });
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        participants: [
          { userId: owner.user._id, role: 'owner' },
          { userId: member.user._id, role: 'member' },
        ],
      }),
    );

    return { owner, member, room, roomModel };
  }

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
    const { user, token } = await seedUser({ displayName: 'Alice' });

    const res = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Office Party' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: 'Office Party',
      creatorId: user._id.toString(),
      inviteCode: expect.any(String),
      status: 'pending',
      participantCount: 1,
      participants: [
        { id: user._id.toString(), displayName: 'Alice', role: 'owner' },
      ],
    });
  });

  it('POST /api/rooms → 409 when the SAME creator reuses a room name (stretch); a different user may reuse it', async () => {
    const { token } = await seedUser();

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Family Santa' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Family Santa' })
      .expect(409);

    const other = await seedUser();
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Family Santa' })
      .expect(201);
  });

  it("GET /api/rooms?page=1&limit=2 → returns the caller's rooms, paginated", async () => {
    const { token } = await seedUser();

    for (const name of ['Room A', 'Room B', 'Room C']) {
      await request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name })
        .expect(201);
    }

    const other = await seedUser();
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Not yours' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
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
    const owner = await seedUser();
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        participants: [{ userId: owner.user._id, role: 'owner' }],
      }),
    );
    const roomId = room._id.toString();

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const stranger = await seedUser();
    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(404);
  });

  it('POST /api/rooms/:id/join → adds the caller when the invite code matches', async () => {
    const owner = await seedUser();
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        inviteCode: 'ABC123',
        participants: [{ userId: owner.user._id, role: 'owner' }],
      }),
    );

    const joiner = await seedUser({ displayName: 'Nick' });
    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/join`)
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ inviteCode: 'ABC123' })
      .expect(201);

    expect(res.body.participantCount).toBe(2);
    expect(res.body.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: joiner.user._id.toString(),
          displayName: 'Nick',
          role: 'member',
        }),
      ]),
    );
  });

  it('POST /api/rooms/:id/join → 400 on a wrong invite code', async () => {
    const owner = await seedUser();
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        inviteCode: 'ABC123',
        participants: [{ userId: owner.user._id, role: 'owner' }],
      }),
    );
    const roomId = room._id.toString();
    const joiner = await seedUser();
    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/join`)
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ inviteCode: 'WRONG9' })
      .expect(400);

    expect(res.body).toMatchObject({ success: false, statusCode: 400 });

    await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200)
      .expect((res) => expect(res.body.participantCount).toBe(1));
  });

  it('POST /api/rooms/:id/draw → creator-only; assigns everyone a giftee (nobody themselves)', async () => {
    const { owner, room, roomModel } = await seedDrawableRoom();

    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    expect(res.body.status).toBe('drawn');
    expect(res.body.exchangeDate).toBeDefined();

    const stored = await roomModel.findById(room._id).lean();

    expect(stored?.assignments).toHaveLength(3);

    for (const a of stored!.assignments) {
      expect(a.giverId.toString()).not.toBe(a.receiverId.toString());
    }

    const givers = new Set(
      stored!.assignments.map((a) => a.giverId.toString()),
    );
    const receivers = new Set(
      stored!.assignments.map((a) => a.receiverId.toString()),
    );

    expect(givers.size).toBe(3);
    expect(receivers.size).toBe(3);
  });

  it('POST /api/rooms/:id/draw → 403 for a non-creator', async () => {
    const { m1, room } = await seedDrawableRoom();

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${m1.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('POST /api/rooms/:id/draw → 400 with fewer than 3 participants', async () => {
    const owner = await seedUser();
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        participants: [{ userId: owner.user._id, role: 'owner' }],
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(400);
  });

  it('POST /api/rooms/:id/draw → 400 when already drawn', async () => {
    const { owner, room } = await seedDrawableRoom();
    const url = `/api/rooms/${room._id.toString()}/draw`;
    const auth = `Bearer ${owner.token}`;

    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', auth)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);
    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', auth)
      .send({ exchangeDate: '2026-12-24' })
      .expect(400);
  });

  it('GET /api/rooms/:id/assignment → returns the giftee + wishlist after the draw', async () => {
    const { owner, m1, m2, room } = await seedDrawableRoom();
    const wishlistModel = app.get<Model<Wishlist>>(
      getModelToken(Wishlist.name),
    );

    await wishlistModel.create({
      roomId: room._id,
      userId: m1.user._id,
      items: ['Wool socks'],
    });
    await wishlistModel.create({
      roomId: room._id,
      userId: m2.user._id,
      items: ['A book'],
    });

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/rooms/${room._id.toString()}/assignment`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const memberIds = [m1.user._id.toString(), m2.user._id.toString()];

    expect(memberIds).toContain(res.body.receiver.id);
    expect(res.body.receiver.id).not.toBe(owner.user._id.toString());
    expect(Array.isArray(res.body.receiver.wishlist)).toBe(true);
    expect(res.body.receiver.wishlist.length).toBe(1);
  });

  // 👇 Lesson 04 — Authorization: roles & permissions.
  // Gate by PERMISSION, never by role. A missing permission → 403; a non-member → 404.
  it('room response includes viewerPermissions for the caller', async () => {
    const { owner, member, room } = await seedOwnerAndMember();
    const id = room._id.toString();

    const ownerRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(ownerRes.body.viewerPermissions).toEqual(
      expect.arrayContaining([
        'room:draw',
        'room:edit',
        'room:delete',
        'room:kick',
        'room:invite',
      ]),
    );

    const memberRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    expect([...memberRes.body.viewerPermissions].sort()).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('owner can run the draw (POST /api/rooms/:id/draw → 200)', async () => {
    const { owner, room } = await seedDrawableRoom();

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);
  });

  it('member running the draw is rejected (POST /api/rooms/:id/draw → 403)', async () => {
    const { member, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('owner can edit the room (PATCH /api/rooms/:id → 200)', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const res = await request(app.getHttpServer())
      .patch(`/api/rooms/${room._id.toString()}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Renamed room' })
      .expect(200);

    expect(res.body.name).toBe('Renamed room');
  });

  it('member editing the room is rejected (PATCH /api/rooms/:id → 403)', async () => {
    const { member, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .patch(`/api/rooms/${room._id.toString()}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ name: 'Renamed room' })
      .expect(403);
  });

  it('owner can delete the room (DELETE /api/rooms/:id → 204)', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const id = room._id.toString();

    await request(app.getHttpServer())
      .delete(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(404);
  });

  it('member deleting the room is rejected (DELETE /api/rooms/:id → 403)', async () => {
    const { member, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .delete(`/api/rooms/${room._id.toString()}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);
  });

  it('owner can kick a member (DELETE /api/rooms/:id/members/:userId → 204)', async () => {
    const { owner, member, room, roomModel } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .delete(
        `/api/rooms/${room._id.toString()}/members/${member.user._id.toString()}`,
      )
      .set('Authorization', `Bearer  ${owner.token}`)
      .expect(204);

    const stored = await roomModel.findById(room._id).lean();

    expect(stored?.participants).toHaveLength(1);
  });

  it('member cannot kick anyone (DELETE /api/rooms/:id/members/:userId → 403)', async () => {
    const { owner, member, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .delete(
        `/api/rooms/${room._id.toString()}/members/${owner.user._id.toString()}`,
      )
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(
        `/api/rooms/${room._id.toString()}/members/${member.user._id.toString()}`,
      )
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);
  });

  it('kicking the owner is rejected (DELETE /api/rooms/:id/members/:ownerId → 400)', async () => {
    const { owner, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .delete(
        `/api/rooms/${room._id.toString()}/members/${owner.user._id.toString()}`,
      )
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(400);
  });

  it('owner can regenerate the invite code (POST /api/rooms/:id/invite-code/regenerate → 200)', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const before = room.inviteCode;
    const res = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(res.body.inviteCode).not.toBe(before);
    expect(res.body.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('member cannot regenerate the invite code (→ 403)', async () => {
    const { member, room } = await seedOwnerAndMember();

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);
  });

  it('a non-member gets 404 on any guarded room route', async () => {
    const { room } = await seedOwnerAndMember();
    const stranger = await seedUser();

    await request(app.getHttpServer())
      .get(`/api/rooms/${room._id.toString()}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(404);
  });

  it('a member can still GET /api/rooms/:id and PUT the wishlist', async () => {
    const { member, room } = await seedOwnerAndMember();
    const id = room._id.toString();

    await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/rooms/${id}/wishlist`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: ['Wool socks'] })
      .expect(200);
  });

  it('chahes a room read - a later GET is from Redis, not the DB', async () => {
    const { owner, room, roomModel } = await seedOwnerAndMember();
    const id = room._id.toString();

    await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    await roomModel.updateOne(
      { _id: room._id },
      { name: 'Changed deirectly in DB' },
    );

    const secondRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(secondRes.body.name).toBe(room.name);
  });

  it('invalidates the cahce when the room is updated via API', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const id = room._id.toString();

    await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Changed via API' })
      .expect(200);

    const secondRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(secondRes.body.name).toBe('Changed via API');
  });

  it('serves shared cahed data but adds viewerPermissions per caller', async () => {
    const { owner, member, room } = await seedOwnerAndMember();
    const id = room._id.toString();

    const ownerRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const memberRes = await request(app.getHttpServer())
      .get(`/api/rooms/${id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    expect(ownerRes.body.viewerPermissions).toContain('room:delete');
    expect([...memberRes.body.viewerPermissions].sort()).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('POST /api/rooms/join -> 201 joins using only the invite code (resolved via Redis)', async () => {
    const owner = await seedUser();
    const other = await seedUser({ displayName: 'John Doe' });

    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Redis test room' })
      .expect(201);

    const code = created.body.inviteCode;

    const res = await request(app.getHttpServer())
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ inviteCode: code })
      .expect(201);

    expect(res.body.id).toBe(created.body.id);
    expect(
      res.body.participants.some(
        (p: { id: string }) => p.id === other.user._id.toString(),
      ),
    ).toBe(true);
  });

  it('POST /api/room/join -> 400 for an unknown or expired code', async () => {
    const { token } = await seedUser();

    await request(app.getHttpServer())
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'ZZZZZZ' })
      .expect(400);
  });

  it('regeneratino the code invalidates the old one for joining', async () => {
    const owner = await seedUser();
    const other = await seedUser();
    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Test Regen Invite Code' })
      .expect(201);

    const oldCode = created.body.inviteCode;
    const roomId = created.body.id;

    const regen = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/invite-code/regenerate`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const newCode = regen.body.inviteCode;
    expect(newCode).not.toBe(oldCode);

    await request(app.getHttpServer())
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ inviteCode: oldCode })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ inviteCode: newCode })
      .expect(201);
  });

  it('publishes room.created after a room is created', async () => {
    const { connect } = jest.requireMock('amqplib');
    const channel = await (await connect.mock.results[0].value).createChannel();
    const amqpPublish = channel.publish as jest.Mock;

    amqpPublish.mockClear();

    const { token } = await seedUser();

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Evented Room' })
      .expect(201);

    expect(amqpPublish.mock.calls.map((c) => c[1])).toContain('room.created');
  });

  it('publishes draw.completed when the draw runs', async () => {
    const { connect } = jest.requireMock('amqplib');
    const channel = await (await connect.mock.results[0].value).createChannel();
    const amqpPublish = channel.publish as jest.Mock;

    amqpPublish.mockClear();

    const { owner, room } = await seedDrawableRoom();

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    expect(amqpPublish.mock.calls.map((c) => c[1])).toContain('draw.completed');
  });
});
