import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Connection, Types } from 'mongoose';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import AllExceptionsFilter from '../src/common/filters/all-exceptions.filter';
import { tokenFor } from './auth-token.helper';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearAllCollections,
} from './setup-mongo';
import { getConnectionToken } from '@nestjs/mongoose/dist/common/mongoose.utils';

describe('Rooms (e2e)', () => {
  let app: NestFastifyApplication;
  let jwt: JwtService;
  let authToken: string;
  let anotherToken: string;

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

    jwt = app.get(JwtService);
    authToken = `Bearer ${tokenFor(jwt, {
      _id: new Types.ObjectId().toString(),
      email: 'alice@test.com',
      role: 'user',
    })}`;
    anotherToken = `Bearer ${tokenFor(jwt, {
      _id: new Types.ObjectId().toString(),
      email: 'bob@test.com',
      role: 'user',
    })}`;
  });

  afterEach(async () => {
    await clearAllCollections(app.get<Connection>(getConnectionToken()));
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  it('creates a room when authorized', async () => {
    const ownerId = new Types.ObjectId().toString();

    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', authToken)
      .send({ name: 'Secret Santa Room', ownerId })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Secret Santa Room',
      creatorId: ownerId,
      participants: [ownerId],
      status: 'pending',
    });
    expect(response.body.inviteCode).toHaveLength(6);
  });

  it('returns 401 when creating a room without a token', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({
        name: 'Secret Santa Room',
        ownerId: new Types.ObjectId().toString(),
      })
      .expect(401);
  });

  it('returns paginated room data from GET /rooms', async () => {
    const ownerId = new Types.ObjectId().toString();

    await Promise.all(
      ['Room A', 'Room B', 'Room C'].map((name) =>
        request(app.getHttpServer())
          .post('/rooms')
          .set('Authorization', authToken)
          .send({ name, ownerId }),
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/rooms?page=1&limit=2')
      .set('Authorization', authToken)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('returns 404 for GET /rooms/:id when the room does not exist', async () => {
    await request(app.getHttpServer())
      .get(`/rooms/${new Types.ObjectId().toString()}`)
      .set('Authorization', authToken)
      .expect(404);
  });

  it('returns 200 for GET /rooms/:id when a room exists even with a different token', async () => {
    const ownerId = new Types.ObjectId().toString();
    const createResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', authToken)
      .send({ name: 'Open Room', ownerId })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/rooms/${createResponse.body.id}`)
      .set('Authorization', anotherToken)
      .expect(200);
  });
});
