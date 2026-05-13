import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('UsersController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    test('creates a user and returns 201 with id, name, email, createdAt', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/users',
          payload: { name: 'Alice', email: 'alice@example.com' },
        });
      expect(res.statusCode).toBe(201);

      const body = res.json();
      expect(body).toEqual({
        id: expect.any(String),
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: expect.any(String),
      });
      expect(new Date(body.createdAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('POST /users - validation', () => {
    test('returns 400 when name is too short', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/users',
          payload: { name: 'A', email: 'alice@example.com' },
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when email is not valid', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/users',
          payload: { name: 'Alice', email: 'not-an-email' },
        });

      expect(res.statusCode).toBe(400);
    });

    test('returns 400 when unknown field is set', async () => {
      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/users',
          payload: { name: 'Alice', email: 'alice@example.com', admin: true },
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /users/:id', () => {
    test('returns 200 with the user when it exists', async () => {
      const created = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/users',
          payload: { name: 'Bob', email: 'bob@example.com' },
        });
      const { id } = created.json();

      const res = await app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'GET',
          url: `/users/${id}`,
        });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        id,
        name: 'Bob',
        email: 'bob@example.com',
      });
    });

    test('returns 404 when the error envelope when the user does not exist', async () => {
      const res = await app.getHttpAdapter().getInstance().inject({
        method: 'GET',
        url: '/users/does-not-exist',
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('does-not-exist'),
        timestamp: expect.any(String),
      });
    });
  });
});
