import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { Connection, Types, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ValidationPipe } from '@nestjs/common';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongo';
import { AppModule } from '../src/app.module';
import { User, UserDocument } from '../src/users/schemas/users.schema';
import {
  Room as RoomSchemaClass,
  RoomDocument,
} from '../src/rooms/schemas/room.schema';
import { userFixture } from './helpers/factories';
import { tokenFor } from './helpers/auth-token';

describe('RoomsController (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
    await startInMemoryMongo();

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
    await app.getHttpAdapter().getInstance().ready();

    connection = app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  describe('Rooms with auth (e2e)', () => {
    let jwt: JwtService;
    let userModel: Model<UserDocument>;
    let roomModel: Model<RoomDocument>;
    let owner: ReturnType<typeof userFixture>;
    let ownerToken: string;

    beforeAll(() => {
      jwt = app.get(JwtService);
      userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
      roomModel = app.get<Model<RoomDocument>>(
        getModelToken(RoomSchemaClass.name),
      );
    });

    beforeEach(async () => {
      owner = userFixture({ email: 'owner@test.com', displayName: 'Owner' });
      await userModel.create(owner);
      ownerToken = tokenFor(jwt, owner);
    });

    const authedPost = (url: string, payload: unknown, token: string) =>
      app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url,
          payload,
          headers: { authorization: `Bearer ${token}` },
        });

    const authedGet = (url: string, token: string) =>
      app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'GET',
          url,
          headers: { authorization: `Bearer ${token}` },
        });

    const authedPatch = (url: string, payload: unknown, token: string) =>
      app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'PATCH',
          url,
          payload,
          headers: { authorization: `Bearer ${token}` },
        });

    const authedDelete = (url: string, token: string) =>
      app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'DELETE',
          url,
          headers: { authorization: `Bearer ${token}` },
        });

    const seedDrawn = (roomId: string, exchangeDate?: Date) =>
      roomModel.updateOne(
        { _id: roomId },
        {
          $set: {
            status: 'drawn',
            drawDate: new Date(),
            ...(exchangeDate ? { exchangeDate } : {}),
          },
        },
      );

    describe('POST /rooms (with JWT)', () => {
      test('returns 201 and sets ownerId from the JWT, not the body', async () => {
        const res = await authedPost(
          '/rooms',
          { name: 'JWT Room' },
          ownerToken,
        );

        expect(res.statusCode).toBe(201);

        const body = res.json();

        expect(body.ownerId).toBe(owner._id.toString());
        expect(body.members).toEqual([owner._id.toString()]);
        expect(body.code).toMatch(/^[A-Z0-9]{6}$/);
        expect(body.status).toBe('pending');
      });

      test('returns 401 with no Authorization header', async () => {
        const res = await app
          .getHttpAdapter()
          .getInstance()
          .inject({
            method: 'POST',
            url: '/rooms',
            payload: { name: 'No Token' },
          });

        expect(res.statusCode).toBe(401);
      });

      test('returns 401 with a malformed Authorization header', async () => {
        const res = await app
          .getHttpAdapter()
          .getInstance()
          .inject({
            method: 'POST',
            url: '/rooms',
            payload: { name: 'Bad Token' },
            headers: { authorization: 'Bearer not-a-real-jwt' },
          });

        expect(res.statusCode).toBe(401);
      });
    });

    describe('GET /rooms (with JWT)', () => {
      test('returns 200 with { data, meta } and respects pagination', async () => {
        for (const name of ['Room 1', 'Room 2', 'Room 3']) {
          await authedPost('/rooms', { name }, ownerToken);
        }

        const res = await authedGet('/rooms?page=1&limit=2', ownerToken);

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('meta');
        expect(body.data).toHaveLength(2);
        expect(body.meta).toEqual({
          total: 3,
          page: 1,
          limit: 2,
          totalPages: 2,
        });
      });

      test('returns 401 without a token', async () => {
        const res = await app
          .getHttpAdapter()
          .getInstance()
          .inject({ method: 'GET', url: '/rooms' });

        expect(res.statusCode).toBe(401);
      });
    });

    describe('POST /rooms/:id/draw', () => {
      async function setupRoomWithMembers(extraMembers: number) {
        const createRes = await authedPost(
          '/rooms',
          { name: 'Draw Room' },
          ownerToken,
        );
        const room = createRes.json();

        for (let i = 0; i < extraMembers; i++) {
          const memberFixture = userFixture({
            email: `member-${i}@test.com`,
          });
          await userModel.create(memberFixture);
          const memberToken = tokenFor(jwt, memberFixture);
          await authedPost(`/rooms/${room.code}/join`, {}, memberToken);
        }

        return room;
      }

      test('returns 200 with status="drawn" and an assignments map when the owner draws a room with >=3 participants', async () => {
        const room = await setupRoomWithMembers(2); // owner + 2 = 3

        const res = await authedPost(`/rooms/${room.id}/draw`, {}, ownerToken);

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body.status).toBe('drawn');
        expect(body.assignments).toBeDefined();
        expect(Object.keys(body.assignments)).toHaveLength(3);

        for (const [giver, recipient] of Object.entries(body.assignments)) {
          expect(giver).not.toBe(recipient);
        }
      });

      test('returns 400 when participants < 3', async () => {
        const room = await setupRoomWithMembers(0); // owner only

        const res = await authedPost(`/rooms/${room.id}/draw`, {}, ownerToken);

        expect(res.statusCode).toBe(400);
      });

      test('returns 403 when caller is not the owner', async () => {
        const room = await setupRoomWithMembers(2);

        const stranger = userFixture({ email: 'stranger@test.com' });
        await userModel.create(stranger);

        const strangerToken = tokenFor(jwt, stranger);

        const res = await authedPost(
          `/rooms/${room.id}/draw`,
          {},
          strangerToken,
        );

        expect(res.statusCode).toBe(403);
      });

      test('returns 404 for an unknown room id', async () => {
        const unusedId = new Types.ObjectId().toString();

        const res = await authedPost(`/rooms/${unusedId}/draw`, {}, ownerToken);

        expect(res.statusCode).toBe(404);
      });

      test('a second+ draws returns 400', async () => {
        const room = await setupRoomWithMembers(2);

        const first = await authedPost(
          `/rooms/${room.id}/draw`,
          {},
          ownerToken,
        );

        expect(first.statusCode).toBe(200);

        const second = await authedPost(
          `/rooms/${room.id}/draw`,
          {},
          ownerToken,
        );

        expect(second.statusCode).toBe(400);
      });

      test('returns 401 with no token', async () => {
        const room = await setupRoomWithMembers(2);

        const res = await app
          .getHttpAdapter()
          .getInstance()
          .inject({
            method: 'POST',
            url: `/rooms/${room.id}/draw`,
            payload: {},
          });
        expect(res.statusCode).toBe(401);
      });
    });

    describe('addMember after draw', () => {
      test('returns 403 when trying to join a room that is already drawn', async () => {
        const createRes = await authedPost(
          '/rooms',
          { name: 'Sealed Room' },
          ownerToken,
        );
        const room = createRes.json();
        const m1 = userFixture({ email: 'm1@test.com' });
        const m2 = userFixture({ email: 'm2@test.com' });

        await userModel.create(m1);
        await userModel.create(m2);
        await authedPost(`/rooms/${room.code}/join`, {}, tokenFor(jwt, m1));
        await authedPost(`/rooms/${room.code}/join`, {}, tokenFor(jwt, m2));
        await authedPost(`/rooms/${room.id}/draw`, {}, ownerToken);

        const latecomer = userFixture({ email: 'late@test.com' });
        await userModel.create(latecomer);
        const res = await authedPost(
          `/rooms/${room.code}/join`,
          {},
          tokenFor(jwt, latecomer),
        );

        expect(res.statusCode).toBe(403);
      });
    });

    describe('PATCH /rooms/:id (set exchange)', () => {
      async function createDrawnRoom(exchangeDate?: Date) {
        const res = await authedPost(
          '/rooms',
          { name: 'Exchange Room' },
          ownerToken,
        );
        const room = res.json();
        await seedDrawn(room.id, exchangeDate);
        return room;
      }

      test('owner sets exchange "date & place" on a drawn room -> 200', async () => {
        const room = await createDrawnRoom();

        const res = await authedPatch(
          `/rooms/${room.id}`,
          {
            exchangeDate: '2099-12-24T18:00:00.000Z',
            exchangePlace: 'Office kitchen',
          },
          ownerToken,
        );

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body.exchangePlace).toBe('Office kitchen');
        expect(body.exchangeDate).toBeDefined();
        expect(body.status).toBe('drawn');
      });

      test('cannot schedule before the draw (pending room) -> 400', async () => {
        const createRes = await authedPost(
          '/rooms',
          { name: 'Pending Room' },
          ownerToken,
        );
        const room = createRes.json();

        const res = await authedPatch(
          `/rooms/${room.id}`,
          { exchangeDate: '2099-12-24T18:00:00.000Z', exchangePlace: 'x' },
          ownerToken,
        );

        expect(res.statusCode).toBe(400);
      });

      test('invalid date -> 400', async () => {
        const room = await createDrawnRoom();

        const res = await authedPatch(
          `/rooms/${room.id}`,
          { exchangeDate: 'not-a-date', exchangePlace: 'x' },
          ownerToken,
        );

        expect(res.statusCode).toBe(400);
      });

      test('non-owner cannot set the exchange -> 403', async () => {
        const room = await createDrawnRoom();

        const stranger = userFixture({ email: 'stranger@test.com' });
        await userModel.create(stranger);

        const res = await authedPatch(
          `/rooms/${room.id}`,
          { exchangeDate: '2099-12-24T18:00:00.000Z', exchangePlace: 'x' },
          tokenFor(jwt, stranger),
        );

        expect(res.statusCode).toBe(403);
      });
    });

    describe('GET /rooms/:id (derive closed)', () => {
      test('a drawn room past its exchange date reads as closed', async () => {
        const createRes = await authedPost(
          '/rooms',
          { name: 'Closing Room' },
          ownerToken,
        );
        const room = createRes.json();

        await seedDrawn(room.id, new Date(Date.now() - 60_000)); // 1 min ago

        const res = await authedGet(`/rooms/${room.id}`, ownerToken);

        expect(res.statusCode).toBe(200);
        expect(res.json().status).toBe('closed'); // derived; DB still stores 'drawn'
      });
    });

    describe('DELETE /rooms/:id', () => {
      test('owner deletes -> 204, then GET -> 404', async () => {
        const createRes = await authedPost(
          '/rooms',
          { name: 'To Delete' },
          ownerToken,
        );
        const room = createRes.json();

        const del = await authedDelete(`/rooms/${room.id}`, ownerToken);
        expect(del.statusCode).toBe(204);

        const get = await authedGet(`/rooms/${room.id}`, ownerToken);
        expect(get.statusCode).toBe(404);
      });

      test('non-owner cannot delete -> 403', async () => {
        const createRes = await authedPost(
          '/rooms',
          { name: 'Protected' },
          ownerToken,
        );
        const room = createRes.json();

        const stranger = userFixture({ email: 'stranger@test.com' });
        await userModel.create(stranger);

        const res = await authedDelete(
          `/rooms/${room.id}`,
          tokenFor(jwt, stranger),
        );

        expect(res.statusCode).toBe(403);
      });

      test('unknown room id -> 404', async () => {
        const res = await authedDelete(
          `/rooms/${new Types.ObjectId().toString()}`,
          ownerToken,
        );

        expect(res.statusCode).toBe(404);
      });
    });
  });
});
