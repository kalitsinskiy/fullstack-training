import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { Room as RoomSchema } from '../src/rooms/schemas/room.schema';
import {
  User as UserSchema,
  UserDocument,
} from '../src/users/schemas/user.schema';
import { tokenFor } from './auth-token.helper';
import { roomFixture, userFixture } from './factories';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

describe('Rooms (e2e)', () => {
  let app: NestFastifyApplication;
  let userModel: Model<UserDocument>;
  let roomModel: Model<RoomSchema>;
  let jwtService: JwtService;
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

    userModel = app.get<Model<UserDocument>>(getModelToken(UserSchema.name));
    roomModel = app.get<Model<RoomSchema>>(getModelToken(RoomSchema.name));
    jwtService = app.get(JwtService);
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

  async function createUserWithToken(overrides: Record<string, unknown> = {}) {
    const user = await userModel.create(userFixture(overrides));
    const token = tokenFor(jwtService, user);

    return { user, token };
  }

  it('POST /api/rooms returns 201 with a room body for authenticated users', async () => {
    const { user, token } = await createUserWithToken({
      email: 'owner@test.com',
    });

    const response = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'North Pole Ops' })
      .expect(201);

    const body = response.body as {
      id: string;
      name: string;
      creatorId: string;
      participants: string[];
      participantCount: number;
      status: string;
      inviteCode: string;
    };
    expect(body).toMatchObject({
      id: expect.any(String) as string,
      name: 'North Pole Ops',
      creatorId: user._id.toString(),
      participants: [user._id.toString()],
      participantCount: 1,
      status: 'pending',
    });
    expect(body.inviteCode).toHaveLength(6);
  });

  it('POST /api/rooms returns 401 without a token', async () => {
    await request(app.getHttpServer())
      .post('/api/rooms')
      .send({ name: 'North Pole Ops' })
      .expect(401);
  });

  it('GET /api/rooms?page=1&limit=2 returns paginated room data', async () => {
    const { user, token } = await createUserWithToken({
      email: 'owner@test.com',
    });

    await roomModel.create([
      roomFixture({
        name: 'Room 1',
        inviteCode: 'ROOM01',
        creatorId: user._id,
        participants: [user._id],
      }),
      roomFixture({
        name: 'Room 2',
        inviteCode: 'ROOM02',
        creatorId: user._id,
        participants: [user._id],
      }),
      roomFixture({
        name: 'Room 3',
        inviteCode: 'ROOM03',
        creatorId: user._id,
        participants: [user._id],
      }),
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as {
      data: unknown[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
    expect(body.data).toHaveLength(2);
    expect(body.meta).toEqual({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
  });

  it('GET /api/rooms/:id rejects users who are not members of the room', async () => {
    const { user: owner } = await createUserWithToken({
      email: 'owner@test.com',
    });
    const { token } = await createUserWithToken({ email: 'guest@test.com' });
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [owner._id],
        inviteCode: 'ROOM99',
      }),
    );

    await request(app.getHttpServer())
      .get(`/api/rooms/${room._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /api/rooms/:id/join adds the caller when the invite code matches', async () => {
    const { user: owner } = await createUserWithToken({
      email: 'owner@test.com',
    });
    const { user: guest, token } = await createUserWithToken({
      email: 'guest@test.com',
    });
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [owner._id],
        inviteCode: 'JOIN01',
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'JOIN01' })
      .expect(201);

    const body = response.body as { participants: string[] };
    expect(body.participants).toContain(guest._id.toString());
  });

  it('POST /api/rooms/:id/join rejects a wrong invite code', async () => {
    const { user: owner } = await createUserWithToken({
      email: 'owner@test.com',
    });
    const { token } = await createUserWithToken({ email: 'guest@test.com' });
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [owner._id],
        inviteCode: 'JOIN02',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'WRONG9' })
      .expect(400);
  });

  it('POST /api/rooms/:id/draw is creator-only and reveals an assignment', async () => {
    const { user: owner, token } = await createUserWithToken({
      email: 'owner@test.com',
    });
    const { user: second } = await createUserWithToken({
      email: 'second@test.com',
    });
    const { user: third } = await createUserWithToken({
      email: 'third@test.com',
    });
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [owner._id, second._id, third._id],
        inviteCode: 'DRAW01',
      }),
    );
    const roomId = room._id.toString();

    const drawResponse = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/draw`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect((drawResponse.body as { status: string }).status).toBe('drawn');

    const assignmentResponse = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/assignment`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = assignmentResponse.body as {
      receiver: { id: string; displayName: string; wishlist: string[] };
    };
    expect(body.receiver.id).not.toBe(owner._id.toString());
    expect([second._id.toString(), third._id.toString()]).toContain(
      body.receiver.id,
    );
  });

  it('POST /api/rooms/:id/draw rejects a non-creator with 403', async () => {
    const { user: owner } = await createUserWithToken({
      email: 'owner@test.com',
    });
    const { user: second } = await createUserWithToken({
      email: 'second@test.com',
    });
    const { user: third, token } = await createUserWithToken({
      email: 'third@test.com',
    });
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner._id,
        participants: [owner._id, second._id, third._id],
        inviteCode: 'DRAW02',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/rooms/${room._id.toString()}/draw`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
