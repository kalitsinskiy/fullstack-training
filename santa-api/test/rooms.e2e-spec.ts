// Set required env vars before any module imports are evaluated
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-e2e';

import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { tokenFor } from './auth-token.helper';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearAllCollections,
} from './setup-mongo';

describe('Rooms (e2e)', () => {
  let app: NestFastifyApplication;
  let request: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  beforeAll(async () => {
    // Disable the global ThrottlerGuard so rate-limiting doesn't interfere.
    jest
      .spyOn(ThrottlerGuard.prototype as any, 'canActivate')
      .mockResolvedValue(true);

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

    request = supertest(app.getHttpServer());
    jwtService = app.get(JwtService);
  });

  afterEach(async () => {
    await clearAllCollections();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
    await stopInMemoryMongo();
  });

  /** Register a user and return the access token + user id */
  async function registerUser(
    email: string,
    displayName: string,
  ): Promise<{ token: string; id: string }> {
    const res = await request.post('/auth/register').send({
      email,
      password: 'Password123!',
      displayName,
    });
    return { token: res.body.accessToken, id: res.body.id };
  }

  describe('POST /rooms', () => {
    it('201 + room body when authenticated', async () => {
      const { token } = await registerUser('alice@rooms.com', 'Alice');

      const res = await request
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Holiday Gifting' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Holiday Gifting');
      expect(res.body).toHaveProperty('status', 'pending');
      expect(res.body).toHaveProperty('inviteCode');
    });

    it('401 without a token', async () => {
      const res = await request.post('/rooms').send({ name: 'No Auth Room' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /rooms', () => {
    it('200 with { data, meta } pagination shape', async () => {
      const { token, id: aliceId } = await registerUser(
        'alice2@rooms.com',
        'Alice2',
      );

      // Create two rooms as Alice so she appears as a participant
      await request
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Room 1' });
      await request
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Room 2' });

      const res = await request
        .get('/rooms?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 2);
      expect(res.body.meta).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /rooms/:id', () => {
    it('403 when the requesting user is not a member of the room', async () => {
      const { token: aliceToken } = await registerUser(
        'alice3@rooms.com',
        'Alice3',
      );
      const { token: bobToken } = await registerUser('bob@rooms.com', 'Bob');

      // Alice creates a room
      const createRes = await request
        .post('/rooms')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: "Alice's Room" });

      const roomId = createRes.body._id;

      // Bob tries to access Alice's room
      const res = await request
        .get(`/rooms/${roomId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
    });

    it('200 when the requesting user is a member of the room', async () => {
      const { token } = await registerUser('alice4@rooms.com', 'Alice4');

      const createRes = await request
        .post('/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: "Alice's Own Room" });

      const roomId = createRes.body._id;

      const res = await request
        .get(`/rooms/${roomId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', roomId);
    });
  });
});
