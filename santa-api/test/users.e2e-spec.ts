import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from '@jest/globals';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection, Model, Types } from 'mongoose';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { User } from '../src/users/schemas/user.schema';
import { createTestApp } from './helpers/test-app.helper';
import { tokenFor } from './helpers/auth-token.helper';
import { userFixture } from './helpers/factories';
import {
  authedGet,
  authedPatch,
  get,
  patch,
} from './helpers/api-request.helper';

interface UserResponse {
  _id: string;
  email: string;
  displayName: string;
}

describe('Users (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleRef: TestingModule;
  let connection: Connection;
  let jwtService: JwtService;
  let userModel: Model<User>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'users-e2e-test-secret';

    ({ app, connection, moduleRef } = await createTestApp({
      validation: true,
      globalPrefix: 'api',
    }));

    jwtService = moduleRef.get(JwtService);
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
  }, 30000);

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedUser(
    overrides: Partial<ReturnType<typeof userFixture>> = {},
  ) {
    const fixture = userFixture(overrides);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await userModel.create(fixture as any);
    const token = tokenFor(jwtService, {
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  describe('GET /api/users/me', () => {
    it('should return the current user profile when authenticated', async () => {
      const { user, token } = await seedUser({ displayName: 'Alice' });

      const res = await authedGet<UserResponse>(app, '/api/users/me', token);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        _id: user._id.toString(),
        email: user.email,
        displayName: 'Alice',
      });
    });

    it('should return 401 when no token is provided', async () => {
      const res = await get(app, '/api/users/me');

      expect(res).toBeUnauthorized();
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update the display name and return 200', async () => {
      const { token } = await seedUser({ displayName: 'Alice' });

      const res = await authedPatch<UserResponse>(app, '/api/users/me', token, {
        displayName: 'Alice Updated',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ displayName: 'Alice Updated' });
    });

    it('should return 400 when displayName fails validation', async () => {
      const { token } = await seedUser();

      const res = await authedPatch(app, '/api/users/me', token, {
        displayName: '',
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await patch(app, '/api/users/me', { displayName: 'Nope' });

      expect(res).toBeUnauthorized();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 200 with the user when found', async () => {
      const { user } = await seedUser({ displayName: 'Bob' });

      const res = await get<UserResponse>(
        app,
        `/api/users/${user._id.toString()}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        _id: user._id.toString(),
        displayName: 'Bob',
      });
    });

    it('should return 404 when the user does not exist', async () => {
      const res = await get(
        app,
        `/api/users/${new Types.ObjectId().toString()}`,
      );

      expect(res.statusCode).toBe(404);
    });
  });
});
