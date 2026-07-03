import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User } from '../src/users/schemas/user.schema';
import { Room } from '../src/rooms/schemas/room.schema';
import { userFixture, roomFixture } from './factories';
import { tokenFor } from './auth-token.helper';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

describe('Wishlist (HTTP)', () => {
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
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalMongoUrl === undefined) delete process.env.MONGO_URL;
    else process.env.MONGO_URL = originalMongoUrl;
    await stopInMemoryMongo();
  });

  async function seedUserAndRoom() {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const roomModel = app.get<Model<Room>>(getModelToken(Room.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture());
    const room = await roomModel.create(
      roomFixture({
        creatorId: user._id,
        participants: [{ userId: user._id, role: 'owner' }],
      }),
    );
    return { user, room, token: tokenFor(jwt, user) };
  }

  it('PUT /api/rooms/:roomId/wishlist → 200 upserts the caller wishlist', async () => {
    const { user, room, token } = await seedUserAndRoom();

    const response = await request(app.getHttpServer())
      .put(`/api/rooms/${room._id.toString()}/wishlist`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Wool socks', 'A good book'] })
      .expect(200);

    expect(response.body).toEqual({
      roomId: room._id.toString(),
      userId: user._id.toString(),
      items: ['Wool socks', 'A good book'],
    });
  });

  it('PUT twice REPLACES the items (upsert, not append)', async () => {
    const { room, token } = await seedUserAndRoom();
    const url = `/api/rooms/${room._id.toString()}/wishlist`;

    await request(app.getHttpServer())
      .put(url)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Old item'] })
      .expect(200);

    const response = await request(app.getHttpServer())
      .put(url)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['New one', 'New two'] })
      .expect(200);

    expect(response.body.items).toEqual(['New one', 'New two']);
  });

  it('GET /api/rooms/:roomId/wishlist/:userId → returns the saved wishlist', async () => {
    const { user, room, token } = await seedUserAndRoom();
    const url = `/api/rooms/${room._id.toString()}/wishlist`;

    await request(app.getHttpServer())
      .put(url)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['Board game'] })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`${url}/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      roomId: room._id.toString(),
      userId: user._id.toString(),
      items: ['Board game'],
    });
  });

  it('GET …/:userId → returns an EMPTY wishlist (not 404) when the user has none', async () => {
    const { user, room, token } = await seedUserAndRoom();

    const response = await request(app.getHttpServer())
      .get(`/api/rooms/${room._id.toString()}/wishlist/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      roomId: room._id.toString(),
      userId: user._id.toString(),
      items: [],
    });
  });

  it('POST /api/rooms → 409 when the SAME creator reuses a name; a different user may reuse it', async () => {
    const { token } = await seedUserAndRoom();

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Family Santa' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Family Santa' })
      .expect(409);

    const other = await seedUserAndRoom();
    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Family Santa' })
      .expect(201);
  });
});
