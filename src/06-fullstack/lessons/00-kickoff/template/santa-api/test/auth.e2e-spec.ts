import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

describe('Auth (e2e)', () => {
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

  it('POST /api/auth/register returns a token for a valid request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice',
      })
      .expect(201);

    const body = response.body as {
      id: string;
      email: string;
      displayName: string;
      accessToken: string;
    };
    expect(body).toMatchObject({
      id: expect.any(String) as string,
      email: 'alice@test.com',
      displayName: 'Alice',
      accessToken: expect.any(String) as string,
    });
  });

  it('POST /api/auth/register returns 400 when required fields are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'alice@test.com' })
      .expect(400);

    const body = response.body as {
      success: boolean;
      statusCode: number;
      message: string[];
    };
    expect(body).toMatchObject({
      success: false,
      statusCode: 400,
      message: expect.any(Array) as string[],
    });
  });

  it('POST /api/auth/register returns 409 for duplicate emails', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice Again',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: 'Email is already registered',
    });
  });

  it('POST /api/auth/login returns a token for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
      })
      .expect(200);

    const body = response.body as { accessToken: string };
    expect(body).toEqual({
      accessToken: expect.any(String) as string,
    });
  });

  it('POST /api/auth/login returns the same generic 401 message for wrong password and unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice',
      })
      .expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'WrongPass1',
      })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'unknown@test.com',
        password: 'WrongPass1',
      })
      .expect(401);

    expect((wrongPassword.body as { message: string }).message).toBe(
      'Invalid credentials',
    );
    expect((unknownEmail.body as { message: string }).message).toBe(
      'Invalid credentials',
    );
  });
});
