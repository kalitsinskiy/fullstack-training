import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Connection } from 'mongoose';
import { createTestApp } from './helpers/test-app.helper';
import { post } from './helpers/api-request.helper';

interface RegisterResponse {
  id: string;
  email: string;
  displayName: string;
  accessToken: string;
}

interface LoginResponse {
  accessToken: string;
}

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'auth-e2e-test-secret';

    ({ app, connection } = await createTestApp({
      validation: true,
      globalPrefix: 'api',
    }));
  }, 30000);

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with accessToken on valid registration', async () => {
      const res = await post<RegisterResponse>(app, '/api/auth/register', {
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        email: 'alice@test.com',
        displayName: 'Alice',
        accessToken: expect.any(String),
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await post(app, '/api/auth/register', {
        email: 'alice@test.com',
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 409 on duplicate email', async () => {
      await post(app, '/api/auth/register', {
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
      });

      const res = await post(app, '/api/auth/register', {
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice Again',
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await post(app, '/api/auth/register', {
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
      });
    });

    it('should return 200 with accessToken on valid credentials', async () => {
      const res = await post<LoginResponse>(app, '/api/auth/login', {
        email: 'alice@test.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ accessToken: expect.any(String) });
    });

    it('should return 401 with "Invalid credentials" for wrong password', async () => {
      const res = await post<{ message: string }>(app, '/api/auth/login', {
        email: 'alice@test.com',
        password: 'wrongpassword',
      });

      expect(res).toBeUnauthorized();
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 with same "Invalid credentials" message for unknown email', async () => {
      const res = await post<{ message: string }>(app, '/api/auth/login', {
        email: 'nobody@test.com',
        password: 'password123',
      });

      expect(res).toBeUnauthorized();
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
