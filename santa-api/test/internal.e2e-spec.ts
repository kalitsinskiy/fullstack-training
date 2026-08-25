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
import { Room } from '../src/rooms/schemas/room.schema';
import { User } from '../src/users/schemas/user.schema';
import { tokenFor } from './auth-token.helper';
import { roomFixture, userFixture } from './factories';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

/**
 * COMPONENT TEST (HTTP slice) for the service-to-service endpoints that
 * santa-notifications calls to enrich RabbitMQ events.
 */
describe('Internal (HTTP)', () => {
  let app: NestFastifyApplication;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalMongoUrl = process.env.MONGO_URL;

  // Published by test/global-setup.ts before AppModule is imported, which is
  // when ConfigModule snapshots it.
  const SERVICE_KEY = process.env.SERVICE_API_KEY as string;

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

  function seedUser(overrides: Record<string, unknown> = {}) {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    return userModel.create(userFixture(overrides));
  }

  function seedRoom(overrides: Record<string, unknown> = {}) {
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    return roomModel.create(roomFixture(overrides));
  }

  describe('GET /api/internal/users/:id', () => {
    it('401s without the service key', async () => {
      const user = await seedUser();

      await request(app.getHttpServer())
        .get(`/api/internal/users/${user._id.toString()}`)
        .expect(401);
    });

    it('401s on a wrong service key', async () => {
      const user = await seedUser();

      await request(app.getHttpServer())
        .get(`/api/internal/users/${user._id.toString()}`)
        .set('X-Service-Key', 'wrong-key-same-length')
        .expect(401);
    });

    it('401s on a user JWT — this route is not for browsers', async () => {
      const user = await seedUser();
      const token = tokenFor(app.get(JwtService), user);

      await request(app.getHttpServer())
        .get(`/api/internal/users/${user._id.toString()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('returns id, displayName and email with the service key', async () => {
      const user = await seedUser({ displayName: 'Alice' });

      const response = await request(app.getHttpServer())
        .get(`/api/internal/users/${user._id.toString()}`)
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(response.body).toEqual({
        id: user._id.toString(),
        displayName: 'Alice',
        email: user.email,
      });
    });

    it('404s on an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/internal/users/665f0c2ab7d13a5e8b1c4d9f')
        .set('X-Service-Key', SERVICE_KEY)
        .expect(404);
    });
  });

  describe('GET /api/internal/rooms/:id', () => {
    it('401s without the service key', async () => {
      const room = await seedRoom();

      await request(app.getHttpServer())
        .get(`/api/internal/rooms/${room._id.toString()}`)
        .expect(401);
    });

    it('returns the room name and member ids for a non-member caller', async () => {
      const owner = await seedUser({ displayName: 'Alice' });
      const member = await seedUser({ displayName: 'Bob' });
      const room = await seedRoom({
        name: 'Office Secret Santa',
        creatorId: owner._id,
        participants: [
          { userId: owner._id, role: 'owner' },
          { userId: member._id, role: 'member' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/internal/rooms/${room._id.toString()}`)
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(response.body).toEqual({
        id: room._id.toString(),
        name: 'Office Secret Santa',
        memberIds: [owner._id.toString(), member._id.toString()],
      });
      expect(response.body.inviteCode).toBeUndefined();
    });

    it('404s on a malformed or unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/internal/rooms/not-an-object-id')
        .set('X-Service-Key', SERVICE_KEY)
        .expect(404);

      await request(app.getHttpServer())
        .get('/api/internal/rooms/665f0c2ab7d13a5e8b1c4d9f')
        .set('X-Service-Key', SERVICE_KEY)
        .expect(404);
    });
  });

  describe('GET /api/internal/rooms/:roomId/relations/:userId', () => {
    it('401s without the service key', async () => {
      const room = await seedRoom();

      await request(app.getHttpServer())
        .get(
          `/api/internal/rooms/${room._id.toString()}/relations/665f0c2ab7d13a5e8b1c4d9f`,
        )
        .expect(401);
    });

    it('returns nulls before the draw', async () => {
      const alice = await seedUser({ displayName: 'Alice' });
      const room = await seedRoom({
        creatorId: alice._id,
        participants: [{ userId: alice._id, role: 'owner' }],
      });

      const response = await request(app.getHttpServer())
        .get(
          `/api/internal/rooms/${room._id.toString()}/relations/${alice._id.toString()}`,
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(response.body).toEqual({ gifteeId: null, santaId: null });
    });

    it('resolves both sides of the cycle after the draw', async () => {
      const alice = await seedUser({ displayName: 'Alice' });
      const bob = await seedUser({ displayName: 'Bob' });
      const carol = await seedUser({ displayName: 'Carol' });
      const room = await seedRoom({
        creatorId: alice._id,
        status: 'drawn',
        participants: [
          { userId: alice._id, role: 'owner' },
          { userId: bob._id, role: 'member' },
          { userId: carol._id, role: 'member' },
        ],
        assignments: [
          { giverId: alice._id, receiverId: bob._id },
          { giverId: bob._id, receiverId: carol._id },
          { giverId: carol._id, receiverId: alice._id },
        ],
      });

      const alicesRelations = await request(app.getHttpServer())
        .get(
          `/api/internal/rooms/${room._id.toString()}/relations/${alice._id.toString()}`,
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(alicesRelations.body).toEqual({
        gifteeId: bob._id.toString(),
        santaId: carol._id.toString(),
      });

      const bobsRelations = await request(app.getHttpServer())
        .get(
          `/api/internal/rooms/${room._id.toString()}/relations/${bob._id.toString()}`,
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(bobsRelations.body).toEqual({
        gifteeId: carol._id.toString(),
        santaId: alice._id.toString(),
      });
    });

    it('returns nulls for a user who is not in the room', async () => {
      const alice = await seedUser();
      const bob = await seedUser();
      const carol = await seedUser();
      const outsider = await seedUser();
      const room = await seedRoom({
        creatorId: alice._id,
        status: 'drawn',
        participants: [
          { userId: alice._id, role: 'owner' },
          { userId: bob._id, role: 'member' },
          { userId: carol._id, role: 'member' },
        ],
        assignments: [
          { giverId: alice._id, receiverId: bob._id },
          { giverId: bob._id, receiverId: carol._id },
          { giverId: carol._id, receiverId: alice._id },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(
          `/api/internal/rooms/${room._id.toString()}/relations/${outsider._id.toString()}`,
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(200);

      expect(response.body).toEqual({ gifteeId: null, santaId: null });
    });

    it('404s on a malformed or unknown room id', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/internal/rooms/not-an-object-id/relations/665f0c2ab7d13a5e8b1c4d9f',
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(404);

      await request(app.getHttpServer())
        .get(
          '/api/internal/rooms/665f0c2ab7d13a5e8b1c4d9f/relations/665f0c2ab7d13a5e8b1c4d1a',
        )
        .set('X-Service-Key', SERVICE_KEY)
        .expect(404);
    });
  });
});
