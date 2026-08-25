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

describe('Users (HTTP)', () => {
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

  it('GET /api/users/me → 401 without a token', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('GET /api/users/me → 200 returns the authenticated user profile', async () => {
    const { user, token } = await seedUserWithToken({
      displayName: 'Alice',
      email: 'alice-me@test.com',
    });

    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: user._id.toString(),
      displayName: 'Alice',
      email: 'alice-me@test.com',
      role: 'user',
    });

    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('PATCH /api/users/me → 200 updates the displayName and returns the fresh user', async () => {
    const { user, token } = await seedUserWithToken({ displayName: 'Old Name' });

    const response = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Alice Frost' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: user._id.toString(),
      displayName: 'Alice Frost',
    });
  });

  it('PATCH /api/users/me → 400 on an invalid displayName', async () => {
    const { token } = await seedUserWithToken();

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'x'.repeat(51) })
      .expect(400);
  });
});
