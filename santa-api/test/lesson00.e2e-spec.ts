import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from './setup-mongo';

/**
 * Lesson 00 bootstrap — full happy path over HTTP (candidate verification).
 * register → login → me → create room → get → list → join → wishlist.
 */
describe('Lesson 00 bootstrap (HTTP)', () => {
  let app: NestFastifyApplication;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

  const register = (over: Record<string, string> = {}) =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `u-${Date.now()}-${Math.random().toString(36).slice(2)}@t.com`,
        password: 'Passw0rd!',
        displayName: 'Tester',
        ...over,
      });

  beforeAll(async () => {
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
    await stopInMemoryMongo();
  });

  it('runs register → login → me → create → get → list → join → wishlist', async () => {
    // 1. register owner
    const reg = await register({ displayName: 'Owner' });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ displayName: 'Owner' });
    expect(typeof reg.body.accessToken).toBe('string');
    const ownerEmail = reg.body.email;

    // 2. login
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ownerEmail, password: 'Passw0rd!' });
    expect(login.status).toBe(200);
    const ownerToken = login.body.accessToken;

    // 3. me
    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: ownerEmail, role: 'user' });

    // 4. create room → owner role + owner viewerPermissions
    const create = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Office Secret Santa' });
    expect(create.status).toBe(201);
    const room = create.body;
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].role).toBe('owner');
    expect(room.viewerPermissions).toEqual(
      expect.arrayContaining(['room:draw', 'room:kick', 'room:delete']),
    );
    expect(typeof room.inviteCode).toBe('string');

    // 5. get room
    const get = await request(app.getHttpServer())
      .get(`/api/rooms/${room.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(get.status).toBe(200);

    // 6. list rooms
    const list = await request(app.getHttpServer())
      .get('/api/rooms?page=1&limit=10')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta.total).toBe(1);

    // 7. second user joins as member
    const reg2 = await register({ displayName: 'Member' });
    const member = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: reg2.body.email, password: 'Passw0rd!' });
    const memberToken = member.body.accessToken;
    const memberId = reg2.body.id;

    const join = await request(app.getHttpServer())
      .post(`/api/rooms/${room.id}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: room.inviteCode });
    expect(join.status).toBe(201);
    expect(join.body.participants).toHaveLength(2);
    expect(join.body.viewerPermissions).not.toContain('room:draw');

    // wrong invite code rejected
    const badJoin = await request(app.getHttpServer())
      .post(`/api/rooms/${room.id}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: 'WRONG1' });
    expect(badJoin.status).toBe(400);

    // 8. member sets a wishlist, owner reads it
    const setW = await request(app.getHttpServer())
      .put(`/api/rooms/${room.id}/wishlist`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ items: ['Wool socks', 'A good book'] });
    expect(setW.status).toBe(200);

    const getW = await request(app.getHttpServer())
      .get(`/api/rooms/${room.id}/wishlist/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(getW.status).toBe(200);
    expect(getW.body.items).toEqual(['Wool socks', 'A good book']);
  });

  it('GET /api/rooms/:id → 404 for a non-member (do not leak existence)', async () => {
    const reg = await register();
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: reg.body.email, password: 'Passw0rd!' });
    const ownerToken = login.body.accessToken;
    const room = (
      await request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Private' })
    ).body;

    const reg2 = await register();
    const outsider = (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: reg2.body.email, password: 'Passw0rd!' })
    ).body.accessToken;

    const res = await request(app.getHttpServer())
      .get(`/api/rooms/${room.id}`)
      .set('Authorization', `Bearer ${outsider}`);
    expect(res.status).toBe(404);
  });
});
