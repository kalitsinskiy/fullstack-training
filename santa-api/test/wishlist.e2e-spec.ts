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

describe('Wishlist (HTTP)', () => {
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

  async function createRoom() {
    const { user, token } = await seedUserWithToken();
    const created = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Wishlist Room' })
      .expect(201);
    return { roomId: created.body.id as string, user, token };
  }

  it('PUT /api/rooms/:roomId/wishlist → 401 without a token', async () => {
    const { roomId } = await createRoom();

    await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .send({ items: ['Wool socks'] })
      .expect(401);
  });

  it('PUT /api/rooms/:roomId/wishlist → 200 upserts the caller wishlist', async () => {
    const { roomId, user, token } = await createRoom();

    const response = await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Wool socks', 'A good book'] })
      .expect(200);

    expect(response.body).toEqual({
      roomId,
      userId: user._id.toString(),
      items: ['Wool socks', 'A good book'],
    });

    // Upsert: a second PUT replaces the items rather than duplicating the doc.
    const updated = await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Coffee beans'] })
      .expect(200);

    expect(updated.body.items).toEqual(['Coffee beans']);
  });

  it('GET /api/rooms/:roomId/wishlist/:userId → returns saved items', async () => {
    const { roomId, user, token } = await createRoom();

    await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Wool socks'] })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/wishlist/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      roomId,
      userId: user._id.toString(),
      items: ['Wool socks'],
    });
  });

  it('GET /api/rooms/:roomId/wishlist/:userId → 200 with an empty list when none set', async () => {
    const { roomId, user, token } = await createRoom();

    const response = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/wishlist/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      roomId,
      userId: user._id.toString(),
      items: [],
    });
  });
});
