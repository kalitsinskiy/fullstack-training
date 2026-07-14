jest.mock('ioredis', () => require('ioredis-mock'));

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { markOnline } from '../src/online-users';

describe('GET /users/online', () => {
  let app: FastifyInstance;
  const originalMongo = process.env.MONGO_URL;

  beforeAll(() => {
    process.env.MONGO_URL = 'mongodb://localhost:27017/test';
  });
  afterAll(() => {
    process.env.MONGO_URL = originalMongo;
  });

  beforeEach(async () => {
    app = buildApp();

    await app.ready();
    await app.redis.flushall();
  });

  afterEach(async () => {
    await app.redis.quit();
    await app.close();
  });

  it('returns an empty list when no one is online', async () => {
    const res = await app.inject({ method: 'GET', url: '/users/online' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns the online users after they are marked online', async () => {
    await markOnline(app.redis, 'u1');
    await markOnline(app.redis, 'u2');

    const res = await app.inject({ method: 'GET', url: '/users/online' });

    expect(res.statusCode).toBe(200);
    expect((res.json() as string[]).sort()).toEqual(['u1', 'u2']);
  });
});
