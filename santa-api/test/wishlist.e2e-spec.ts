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
import { userFixture } from './factories';
import { tokenFor } from './auth-token.helper';
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

  it('PUT /api/rooms/:roomId/wishlist & GET /api/rooms/:roomId/wishlist/:userId', async () => {
    const userModel = app.get(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture());
    const token = tokenFor(jwt, user);

    const roomRes = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Wishlist Room' });

    const roomId = roomRes.body.id;

    // Get initial wishlist (should be empty array)
    const initialGet = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/wishlist/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(initialGet.body).toMatchObject({
      roomId,
      userId: user._id.toString(),
      items: [],
    });

    // Set wishlist items
    const putRes = await request(app.getHttpServer())
      .put(`/api/rooms/${roomId}/wishlist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Book', 'Socks'] })
      .expect(200);

    expect(putRes.body).toMatchObject({
      roomId,
      userId: user._id.toString(),
      items: ['Book', 'Socks'],
    });

    // Get updated wishlist
    const updatedGet = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/wishlist/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(updatedGet.body.items).toEqual(['Book', 'Socks']);
  });
});
