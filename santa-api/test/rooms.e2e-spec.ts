import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Connection, Model, Types } from 'mongoose';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { EventPublisherService } from '../src/events/eventPublisher.service';
import { RedisService } from '../src/common/redis/redis.service';
import { tokenFor } from './auth-token.helper';
import { userFixture } from './factories';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearAllCollections,
} from './setup-mongo';
import { getConnectionToken } from '@nestjs/mongoose/dist/common/mongoose.utils';
import { User } from '../src/users/schemas/user.schema';

type RoomBody = {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  participants: Array<{ id: string; role: string }>;
  viewerPermissions: string[];
  data?: RoomBody[];
  meta?: Record<string, number>;
};

describe('Rooms (e2e)', () => {
  let app: NestFastifyApplication;
  let jwt: JwtService;
  let userModel: Model<User>;

  beforeAll(async () => {
    const uri = await startInMemoryMongo();
    process.env.MONGO_URL = uri;

    const store = new Map<string, string>();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EventPublisherService)
      .useValue({ publish: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({
        get: (k: string) => Promise.resolve(store.get(k) ?? null),
        set: (k: string, v: string) => {
          store.set(k, v);
          return Promise.resolve();
        },
        del: (k: string) => {
          store.delete(k);
          return Promise.resolve();
        },
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    jwt = app.get(JwtService);
    userModel = app.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(async () => {
    await clearAllCollections(app.get<Connection>(getConnectionToken()));
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  /** Seeds a real user in the DB and returns a signed token for them. */
  async function seedUser(
    overrides: Partial<{ email: string; role: string }> = {},
  ) {
    type CreatedUser = { _id: Types.ObjectId; email: string; role: string };
    const [user] = await (
      userModel.create as (d: unknown[]) => Promise<CreatedUser[]>
    )([userFixture(overrides)]);
    const token = `Bearer ${tokenFor(jwt, { _id: user._id.toString(), email: user.email, role: user.role })}`;
    return { user, token };
  }

  it('creates a room when authorized', async () => {
    const { token } = await seedUser();

    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Secret Santa Room' })
      .expect(201);

    const body = response.body as RoomBody;
    expect(body).toMatchObject({
      name: 'Secret Santa Room',
      status: 'pending',
    });
    expect(body.inviteCode).toHaveLength(6);
  });

  it('returns 401 when creating a room without a token', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({ name: 'Secret Santa Room' })
      .expect(401);
  });

  it('returns paginated room data from GET /rooms', async () => {
    const { token } = await seedUser();

    await Promise.all(
      ['Room A', 'Room B', 'Room C'].map((name) =>
        request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', token)
          .send({ name }),
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/rooms?page=1&limit=2')
      .set('Authorization', token)
      .expect(200);

    const body = response.body as RoomBody;
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.data).toHaveLength(2);
    expect(body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('returns 404 for GET /rooms/:id when the room does not exist', async () => {
    const { token } = await seedUser();

    await request(app.getHttpServer())
      .get(`/rooms/${new Types.ObjectId().toString()}`)
      .set('Authorization', token)
      .expect(404);
  });

  it('returns 200 for GET /rooms/:id for the owner', async () => {
    const { token } = await seedUser();

    const createResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Owner Room' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/rooms/${(createResponse.body as RoomBody).id}`)
      .set('Authorization', token)
      .expect(200);
  });

  // Lesson 04: Roles & Permissions

  it('room response includes viewerPermissions for the owner', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Permissions Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    expect(room.viewerPermissions).toEqual(
      expect.arrayContaining([
        'room:view',
        'room:draw',
        'room:invite',
        'room:kick',
        'room:edit',
        'room:delete',
        'wishlist:set',
      ]),
    );
  });

  it('owner participant entry has role "owner"', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Role Check Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].role).toBe('owner');
  });

  it('member who joins gets role "member" and limited viewerPermissions', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Member Role Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const joinedResponse = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);
    const joined = joinedResponse.body as RoomBody;

    const memberEntry = joined.participants.find(
      (p: { role: string }) => p.role === 'member',
    );
    expect(memberEntry).toBeDefined();
    expect(joined.viewerPermissions).toEqual(
      expect.arrayContaining(['room:view', 'wishlist:set']),
    );
    expect(joined.viewerPermissions).not.toContain('room:draw');
    expect(joined.viewerPermissions).not.toContain('room:edit');
    expect(joined.viewerPermissions).not.toContain('room:delete');
    expect(joined.viewerPermissions).not.toContain('room:kick');
    expect(joined.viewerPermissions).not.toContain('room:invite');
  });

  it('non-participant gets 404 on GET /rooms/:id (room existence is not leaked)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: strangerToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Private Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .get(`/rooms/${room.id}`)
      .set('Authorization', strangerToken)
      .expect(404);
  });

  it('member gets 403 on POST /rooms/:id/draw (requires room:draw)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Draw Perm Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/draw`)
      .set('Authorization', memberToken)
      .send({ exchangeDate: '2026-12-24' })
      .expect(403);
  });

  it('member gets 403 on PATCH /rooms/:id (requires room:edit)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Edit Perm Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', memberToken)
      .send({ name: 'Hacked Name' })
      .expect(403);
  });

  it('member gets 403 on DELETE /rooms/:id (requires room:delete)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Delete Perm Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}`)
      .set('Authorization', memberToken)
      .expect(403);
  });

  it('member gets 403 on DELETE /rooms/:id/members/:userId (requires room:kick)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();
    const { token: thirdToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Kick Perm Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const bobJoinedResponse = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);
    const bobJoined = bobJoinedResponse.body as RoomBody;

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', thirdToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);

    const bobEntry = bobJoined.participants.find(
      (p: { role: string }) => p.role === 'member',
    );

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}/members/${bobEntry!.id}`)
      .set('Authorization', memberToken)
      .expect(403);
  });

  it('member gets 403 on POST /rooms/:id/invite-code/regenerate (requires room:invite)', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Invite Perm Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/invite-code/regenerate`)
      .set('Authorization', memberToken)
      .expect(403);
  });

  it('owner can delete a room (DELETE /rooms/:id returns 204)', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Room To Delete' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}`)
      .set('Authorization', token)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/rooms/${room.id}`)
      .set('Authorization', token)
      .expect(404);
  });

  it('owner cannot kick themselves (400)', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Kick Owner Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const ownerEntry = room.participants[0];

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}/members/${ownerEntry.id}`)
      .set('Authorization', token)
      .expect(400);
  });

  it('owner can kick a member', async () => {
    const { token: ownerToken } = await seedUser();
    const { token: memberToken } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', ownerToken)
      .send({ name: 'Kick Member Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const joinedResponse = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/join`)
      .set('Authorization', memberToken)
      .send({ inviteCode: room.inviteCode })
      .expect(201);
    const joined = joinedResponse.body as RoomBody;

    const memberEntry = joined.participants.find(
      (p: { role: string }) => p.role === 'member',
    );

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}/members/${memberEntry!.id}`)
      .set('Authorization', ownerToken)
      .expect(204);

    const updatedResponse = await request(app.getHttpServer())
      .get(`/rooms/${room.id}`)
      .set('Authorization', ownerToken)
      .expect(200);
    const updated = updatedResponse.body as RoomBody;

    expect(updated.participants).toHaveLength(1);
  });

  it('owner can regenerate the invite code', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Regenerate Code Room' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const updatedResponse = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/invite-code/regenerate`)
      .set('Authorization', token)
      .expect(200);
    const updated = updatedResponse.body as RoomBody;

    expect(updated.inviteCode).toHaveLength(6);
    expect(updated.inviteCode).not.toBe(room.inviteCode);
  });

  it('owner can edit the room name', async () => {
    const { token } = await seedUser();

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', token)
      .send({ name: 'Original Name' })
      .expect(201);
    const room = roomResponse.body as RoomBody;

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', token)
      .send({ name: 'Renamed Room' })
      .expect(200);
    const updated = updatedResponse.body as RoomBody;

    expect(updated.name).toBe('Renamed Room');
  });
});
