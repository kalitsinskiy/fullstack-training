import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
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
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalMongoUrl === undefined) delete process.env.MONGO_URL;
    else process.env.MONGO_URL = originalMongoUrl;
    await stopInMemoryMongo();
  });

  async function seedUser(overrides: Record<string, unknown> = {}) {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture(overrides));
    return { user, token: tokenFor(jwt, user) };
  }

  it('GET /api/users/me → 200 returns the caller profile { id, displayName, email, role }', async () => {
    const { user, token } = await seedUser({ displayName: 'Alice' });

    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: user._id.toString(),
      displayName: 'Alice',
      email: user.email,
      role: 'user',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('GET /api/users/me → 401 without a token', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('PATCH /api/users/me → 200 updates the displayName', async () => {
    const { user, token } = await seedUser({ displayName: 'Old Name' });

    const response = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'New Name' })
      .expect(200);

    expect(response.body).toEqual({
      id: user._id.toString(),
      displayName: 'New Name',
      email: user.email,
      role: 'user',
    });

    const after = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(after.body.displayName).toBe('New Name');
  });

  it('PATCH /api/users/me → 400 on an invalid displayName', async () => {
    const { token } = await seedUser();

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: '' })
      .expect(400);
  });
});
