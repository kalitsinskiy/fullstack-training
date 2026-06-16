import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import request from 'supertest';
import { WishlistModule } from './wishlist.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { User, UserSchema, UserDocument } from '../users/schemas/users.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
} from '../../test/helpers/mongo';

describe('WishlistController (HTTP)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let token: string;
  let userId: string;
  let roomId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const uri = await startInMemoryMongo();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        UsersModule,
        AuthModule,
        RoomsModule,
        WishlistModule,
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
    await userModel.ensureIndexes();
  }, 30000);

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await userModel.db.collection('rooms').deleteMany({});
    await userModel.db.collection('wishlists').deleteMany({});
    await userModel.deleteMany({});

    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'me@example.com',
        password: 'SecretPass1',
        displayName: 'Me',
      });
    token = regRes.body.accessToken;
    userId = regRes.body.id;

    const roomRes = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Room' });
    roomId = roomRes.body.id;
  });

  describe('POST /rooms/:roomId/wishlist', () => {
    test('200 + creates wishlist for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post(`/rooms/${roomId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ name: 'Lego set' }] })
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe('Lego set');
    });

    test('401 without token', async () => {
      await request(app.getHttpServer())
        .post(`/rooms/${roomId}/wishlist`)
        .send({ items: [{ name: 'Lego set' }] })
        .expect(401);
    });

    test('400 if `userId` is sent in the body (whitelist)', async () => {
      await request(app.getHttpServer())
        .post(`/rooms/${roomId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: 'someone-else', items: [{ name: 'X' }] })
        .expect(400);
    });
  });

  describe('GET /rooms/:roomId/wishlist/:userId', () => {
    test('returns the wishlist when it exists', async () => {
      await request(app.getHttpServer())
        .post(`/rooms/${roomId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ name: 'Lego set' }] });

      const res = await request(app.getHttpServer())
        .get(`/rooms/${roomId}/wishlist/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.items[0].name).toBe('Lego set');
    });

    test("includes the wishlist owner's display name", async () => {
      await request(app.getHttpServer())
        .post(`/rooms/${roomId}/wishlist`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ name: 'Lego set' }] });

      const res = await request(app.getHttpServer())
        .get(`/rooms/${roomId}/wishlist/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.userName).toBe('Me');
      expect(res.body.userId).toBe(userId);
      expect(res.body.roomId).toBe(roomId);
    });

    test('404 when no wishlist exists', async () => {
      await request(app.getHttpServer())
        .get(`/rooms/${roomId}/wishlist/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/rooms/${roomId}/wishlist/${userId}`)
        .expect(401);
    });
  });
});
