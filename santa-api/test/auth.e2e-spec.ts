import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import AllExceptionsFilter from '../src/common/filters/all-exceptions.filter';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearAllCollections,
} from './setup-mongo';
import { getConnectionToken } from '@nestjs/mongoose/dist/common/mongoose.utils';
import { Connection } from 'mongoose';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
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
  });

  afterEach(async () => {
    await clearAllCollections(app.get<Connection>(getConnectionToken()));
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  it('registers a new user and returns an accessToken', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice@test.com',
        password: 'supersecret123',
        displayName: 'Alice',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
  });

  it('returns 400 when required fields are missing', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'missing@test.com' })
      .expect(400);
  });

  it('returns 409 when registering with a duplicate email', async () => {
    const payload = {
      email: 'bob@test.com',
      password: 'supersecret123',
      displayName: 'Bob',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(409);
  });

  it('returns 200 and accessToken for valid login credentials', async () => {
    const payload = {
      email: 'carol@test.com',
      password: 'supersecret123',
      displayName: 'Carol',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
  });

  it('returns 401 for wrong password with the generic message', async () => {
    const payload = {
      email: 'dave@test.com',
      password: 'supersecret123',
      displayName: 'Dave',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: 'wrong-password' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('returns 401 for unknown email with the same generic message', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unknown@test.com', password: 'password123' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });
});
