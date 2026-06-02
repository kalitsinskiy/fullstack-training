// Set required env vars before any module imports are evaluated
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-e2e';

import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearAllCollections,
} from './setup-mongo';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    // Disable the global ThrottlerGuard at the prototype level so rate-limit
    // decorators on auth routes don't block the test suite.
    jest
      .spyOn(ThrottlerGuard.prototype as any, 'canActivate')
      .mockResolvedValue(true);

    const uri = await startInMemoryMongo();
    process.env.MONGO_URL = uri;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    request = supertest(app.getHttpServer());
  });

  afterEach(async () => {
    await clearAllCollections();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
    await stopInMemoryMongo();
  });

  describe('POST /auth/register', () => {
    it('201 + accessToken on valid registration', async () => {
      const res = await request.post('/auth/register').send({
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('email', 'alice@test.com');
    });

    it('400 on missing required fields', async () => {
      const res = await request.post('/auth/register').send({
        email: 'alice@test.com',
        // missing password and displayName
      });

      expect(res.status).toBe(400);
    });

    it('409 on duplicate email', async () => {
      const userData = {
        email: 'bob@test.com',
        password: 'password123',
        displayName: 'Bob',
      };

      await request.post('/auth/register').send(userData).expect(201);

      const res = await request.post('/auth/register').send(userData);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request.post('/auth/register').send({
        email: 'loginuser@test.com',
        password: 'password123',
        displayName: 'Login User',
      });
    });

    it('200 + accessToken on valid credentials', async () => {
      const res = await request.post('/auth/login').send({
        email: 'loginuser@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('401 with generic message for wrong password', async () => {
      const res = await request.post('/auth/login').send({
        email: 'loginuser@test.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('401 with same generic message for non-existent email', async () => {
      const res = await request.post('/auth/login').send({
        email: 'nobody@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
