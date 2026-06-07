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
import { PaginatedResponse } from '../src/common/pagination';
import { createTestApp } from './helpers/test-app.helper';
import { tokenFor } from './helpers/auth-token.helper';
import { userFixture } from './helpers/factories';
import { authedGet, authedPost, post } from './helpers/api-request.helper';

interface RoomResponse {
  _id: string;
  name: string;
  status: 'pending' | 'drawn';
  inviteCode: string;
  participants: string[];
}

describe('Rooms (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleRef: TestingModule;
  let connection: Connection;
  let jwtService: JwtService;
  let userModel: Model<User>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'rooms-e2e-test-secret';

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

  async function seedUser(emailOverride?: string) {
    const fixture = userFixture(
      emailOverride !== undefined ? { email: emailOverride } : {},
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await userModel.create(fixture as any);
    const token = tokenFor(jwtService, {
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async function createRoom(token: string, name = 'Test Room') {
    const res = await authedPost<RoomResponse>(app, '/api/rooms', token, {
      name,
    });
    return res.body;
  }

  function joinRoom(token: string, code: string) {
    return authedPost(app, `/api/rooms/${code}/join`, token);
  }

  function drawRoom(token: string, roomId: string) {
    return authedPost(app, `/api/rooms/${roomId}/draw`, token);
  }

  /** Creates a room with `count` participants (the owner plus `count - 1` joiners) and returns their tokens. */
  async function roomWithParticipants(count: number) {
    const owner = await seedUser();
    const room = await createRoom(owner.token, 'Group Room');

    const tokens = [owner.token];
    for (let i = 1; i < count; i++) {
      const member = await seedUser();
      await joinRoom(member.token, room.inviteCode);
      tokens.push(member.token);
    }
    return { room, ownerToken: owner.token, tokens };
  }

  describe('POST /api/rooms', () => {
    it('should create a room and return 201 with the room body when authenticated', async () => {
      const { token } = await seedUser();

      const res = await authedPost<RoomResponse>(app, '/api/rooms', token, {
        name: 'My Secret Santa Room',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        name: 'My Secret Santa Room',
        status: 'pending',
        participants: expect.any(Array),
      });
      expect(res.body.participants).toHaveLength(1);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await post(app, '/api/rooms', { name: 'My Room' });

      expect(res).toBeUnauthorized();
    });
  });

  describe('GET /api/rooms', () => {
    it('should return paginated { data, meta } with page and limit', async () => {
      const { token } = await seedUser();
      await createRoom(token, 'Room 1');
      await createRoom(token, 'Room 2');
      await createRoom(token, 'Room 3');

      const res = await authedGet<PaginatedResponse<RoomResponse>>(
        app,
        '/api/rooms?page=1&limit=2',
        token,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        }),
      });
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should return 200 with the room when the user is a member', async () => {
      const { token } = await seedUser();
      const room = await createRoom(token, 'My Room');

      const res = await authedGet<RoomResponse>(
        app,
        `/api/rooms/${room._id}`,
        token,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ _id: room._id, name: 'My Room' });
    });

    it('should return 403 when requesting a room the user is not a member of', async () => {
      const { token: tokenA } = await seedUser();
      const { token: tokenB } = await seedUser();

      const room = await createRoom(tokenA, 'Private Room');

      const res = await authedGet(app, `/api/rooms/${room._id}`, tokenB);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 when the room does not exist', async () => {
      const { token } = await seedUser();

      const res = await authedGet(
        app,
        `/api/rooms/${new Types.ObjectId().toString()}`,
        token,
      );

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/rooms/:code/join', () => {
    it('should add the user to the room and return 201', async () => {
      const { token: ownerToken } = await seedUser();
      const { token: joinerToken } = await seedUser();
      const room = await createRoom(ownerToken, 'Joinable Room');

      const res = await joinRoom(joinerToken, room.inviteCode);

      expect(res.statusCode).toBe(201);
      expect((res.body as RoomResponse).participants).toHaveLength(2);
    });

    it('should return 404 when the invite code does not match any room', async () => {
      const { token } = await seedUser();

      const res = await joinRoom(token, 'NOPE99');

      expect(res.statusCode).toBe(404);
    });

    it('should return 403 when the room has already been drawn', async () => {
      const { room, ownerToken } = await roomWithParticipants(3);
      const { token: latecomerToken } = await seedUser();
      await drawRoom(ownerToken, room._id);

      const res = await joinRoom(latecomerToken, room.inviteCode);

      expect(res.statusCode).toBe(403);
    });

    it('should return 401 when no token is provided', async () => {
      const { token: ownerToken } = await seedUser();
      const room = await createRoom(ownerToken, 'Joinable Room');

      const res = await post(app, `/api/rooms/${room.inviteCode}/join`);

      expect(res).toBeUnauthorized();
    });
  });

  describe('POST /api/rooms/:id/draw', () => {
    it('should run the draw, mark the room as drawn, and return 201', async () => {
      const { room, ownerToken } = await roomWithParticipants(3);

      const res = await drawRoom(ownerToken, room._id);

      expect(res.statusCode).toBe(201);
      expect((res.body as RoomResponse).status).toBe('drawn');
    });

    it('should return 403 when the caller is not the room owner', async () => {
      const { room, tokens } = await roomWithParticipants(3);

      const res = await drawRoom(tokens[1], room._id);

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 when there are fewer than 3 participants', async () => {
      const { room, ownerToken } = await roomWithParticipants(2);

      const res = await drawRoom(ownerToken, room._id);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when the room has already been drawn', async () => {
      const { room, ownerToken } = await roomWithParticipants(3);
      await drawRoom(ownerToken, room._id);

      const res = await drawRoom(ownerToken, room._id);

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when the room does not exist', async () => {
      const { token } = await seedUser();

      const res = await drawRoom(token, new Types.ObjectId().toString());

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 when no token is provided', async () => {
      const { room } = await roomWithParticipants(3);

      const res = await post(app, `/api/rooms/${room._id}/draw`);

      expect(res).toBeUnauthorized();
    });
  });
});
