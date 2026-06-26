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

/**
 * COMPONENT TEST (HTTP slice) — the approach for this whole course.
 *
 * We boot the real AppModule against an in-memory MongoDB and drive it through
 * real HTTP with supertest. No mocking of services or the database: a request
 * goes through pipes → guards → controller → service → Mongo, exactly like prod.
 *
 * One example below is fully written so you can see the wiring. The rest are
 * `it.todo(...)` — turn each into a real test as you implement AuthService.
 * Add more scenarios as you find edge cases; this list is a floor, not a ceiling.
 */
describe('Auth (HTTP)', () => {
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

  // ✅ WORKED EXAMPLE — green against the skeleton: validation runs in the
  // ValidationPipe, before AuthService is ever called. Study this wiring, then
  // implement the service and fill in the `it.todo`s below the same way.
  it('POST /api/auth/register → 400 when required fields are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'alice@test.com' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: expect.any(Array) as string[],
    });
  });

  const creds = {
    email: 'alice@test.com',
    password: 'Passw0rd!',
    displayName: 'Alice',
  };

  it('POST /api/auth/register → 201 returns { id, email, displayName, accessToken }', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(creds)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String) as string,
      email: creds.email,
      displayName: creds.displayName,
      accessToken: expect.any(String) as string,
    });
  });

  it('POST /api/auth/register → 409 when the email is already registered', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(creds)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(creds)
      .expect(409);
  });

  it('POST /api/auth/login → 200 returns an accessToken for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(creds)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('POST /api/auth/login → 401 with the SAME generic message for a wrong password AND an unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(creds)
      .expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrong-password' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: creds.password })
      .expect(401);

    // Same generic message either way — never reveal whether the email exists.
    expect(wrongPassword.body.message).toEqual(unknownEmail.body.message);
  });
});
