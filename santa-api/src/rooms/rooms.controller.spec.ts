import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import request from 'supertest';
import { RoomsModule } from './rooms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { User, UserDocument } from '../users/schemas/users.schema';
import { Room as RoomSchemaClass, RoomDocument } from './schemas/room.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
} from '../../test/helpers/mongo';

describe('RoomsController (HTTP)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let roomModel: Model<RoomDocument>;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const uri = await startInMemoryMongo();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        UsersModule,
        AuthModule,
        RoomsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userModel = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));
    roomModel = moduleRef.get<Model<RoomDocument>>(
      getModelToken(RoomSchemaClass.name),
    );
    await userModel.ensureIndexes();
  }, 30000);

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await userModel.db.collection('rooms').deleteMany({});
    await userModel.deleteMany({});

    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'owner@example.com',
      password: 'SecretPass1',
      displayName: 'Owner',
    });

    token = res.body.accessToken;
    userId = res.body.id;
  });

  async function markDrawn(roomId: string, opts: { exchangeDate?: Date } = {}) {
    await roomModel.updateOne(
      { _id: roomId },
      {
        $set: {
          status: 'drawn',
          drawDate: new Date(),
          ...(opts.exchangeDate ? { exchangeDate: opts.exchangeDate } : {}),
        },
      },
    );
  }

  async function createRoom(name = 'Test Room') {
    const res = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });

    return res.body as { id: string; code: string };
  }

  describe('POST /rooms', () => {
    test('201 + creates a room owned by the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Office Secret Santa' })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        name: 'Office Secret Santa',
        ownerId: userId,
        code: expect.any(String),
        members: [userId],
        status: 'pending',
        createdAt: expect.any(String),
      });
    });

    test('401 without Authorization header', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .send({ name: 'Office Secret Santa' })
        .expect(401);
    });

    test('400 if `ownerId` is sent in the body (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Office Secret Santa', ownerId: 'someone-else' })
        .expect(400);
    });

    test('400 if name is too short', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(400);
    });
  });

  describe('GET /rooms (paginated)', () => {
    test('returns {data, meta} shape even when empty', async () => {
      const res = await request(app.getHttpServer())
        .get('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });
    });

    test('returns the user`s rooms with default page/limit', async () => {
      for (const name of ['Room A', 'Room B', 'Room C']) {
        await request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', `Bearer ${token}`)
          .send({ name });
      }

      const res = await request(app.getHttpServer())
        .get('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(3);
      expect(res.body.meta).toEqual({
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    test('limit slices the page; totalPages reflects total', async () => {
      for (const name of ['Room A', 'Room B', 'Room C']) {
        await request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', `Bearer ${token}`)
          .send({ name });
      }

      const res = await request(app.getHttpServer())
        .get('/rooms?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
    });

    test('page=2 returns the next slice', async () => {
      for (const name of ['Room A', 'Room B', 'Room C']) {
        await request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', `Bearer ${token}`)
          .send({ name });
      }

      const res = await request(app.getHttpServer())
        .get('/rooms?page=2&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.totalPages).toBe(2);
    });

    test('beyond last page -> empty data, accurate meta', async () => {
      for (const name of ['Room A', 'Room B', 'Room C']) {
        await request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', `Bearer ${token}`)
          .send({ name });
      }

      const res = await request(app.getHttpServer())
        .get('/rooms?page=10&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    test('clamps limit > 100 and page < 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/rooms?page=-1&limit=999')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(100);
    });

    test('returns only rooms the user is a participant in', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Room' });

      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'SecretPass1',
          displayName: 'Other',
        });

      const otherToken = otherUser.body.accessToken;
      await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other Room' });

      const res = await request(app.getHttpServer())
        .get('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('My Room');
    });

    test('401 without token', async () => {
      await request(app.getHttpServer()).get('/rooms').expect(401);
    });
  });

  describe('GET /rooms/:id', () => {
    test('returns the room when it exists', async () => {
      const created = await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Some Room' });

      const res = await request(app.getHttpServer())
        .get(`/rooms/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    test('404 when the room does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/rooms/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /rooms/:code/join', () => {
    test('200 + adds the authenticated user to the room', async () => {
      // owner creates a room
      const created = await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Open Room' });
      const code = created.body.code;

      // a second user registers and joins
      const joinerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'joiner@example.com',
          password: 'SecretPass1',
          displayName: 'Joiner',
        });
      const joinerToken = joinerRes.body.accessToken;
      const joinerId = joinerRes.body.id;

      const res = await request(app.getHttpServer())
        .post(`/rooms/${code}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .expect(200);

      expect(res.body.members).toEqual(
        expect.arrayContaining([userId, joinerId]),
      );
    });

    test('404 when the code is unknown', async () => {
      await request(app.getHttpServer())
        .post('/rooms/ZZZZZZ/join')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('401 without token', async () => {
      await request(app.getHttpServer()).post('/rooms/ABC123/join').expect(401);
    });
  });

  describe('PATCH /rooms/:id (set exchange', () => {
    test('200 when owner sets exchange "date & place" on a drawn room', async () => {
      const room = await createRoom('Drawn Room');
      await markDrawn(room.id);

      const res = await request(app.getHttpServer())
        .patch(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          exchangeDate: '2099-12-24T18:00:00.000Z',
          exchangePlace: 'Office kitchen',
        })
        .expect(200);

      expect(res.body.exchangePlace).toBe('Office kitchen');
      expect(res.body.exchangeDate).toBeDefined();
      expect(res.body.status).toBe('drawn');
    });

    test('400 when cannot schedule berfore the draw (pending room)', async () => {
      const room = await createRoom('Pending Room');
      await request(app.getHttpServer())
        .patch(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ exchangeDate: '2099-12-24T18:00:00.000Z', exchangePlace: 'x' })
        .expect(400);
    });

    test('400 with invalid date', async () => {
      const room = await createRoom('Bad Date Room');
      await markDrawn(room.id);
      await request(app.getHttpServer())
        .patch(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ exchangeDate: 'not-a-date', exchangePlace: 'x' })
        .expect(400);
    });

    test('403 — non-owner cannot set the exchange', async () => {
      const room = await createRoom('Owned Room');
      await markDrawn(room.id);

      const other = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'SecretPass1',
          displayName: 'Other',
        });

      await request(app.getHttpServer())
        .patch(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${other.body.accessToken}`)
        .send({ exchangeDate: '2099-12-24T18:00:00.000Z', exchangePlace: 'x' })
        .expect(403);
    });
  });

  describe('DELETE /rooms/:id', () => {
    test('204 when owner deletes room, then the room became 404s', async () => {
      const room = await createRoom('To Delete');

      await request(app.getHttpServer())
        .delete(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('403 when non-owner tries to delete room', async () => {
      const room = await createRoom('Protected Room');
      const other = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'SecretPass1',
          displayName: 'Other',
        });

      await request(app.getHttpServer())
        .delete(`/rooms/${room.id}`)
        .set('Authorization', `Bearer ${other.body.accessToken}`)
        .expect(403);
    });

    test('404 on deleting a non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app.getHttpServer())
        .delete(`/rooms/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
