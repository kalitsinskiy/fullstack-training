import request from 'supertest';
import { useTestApp } from './helpers/e2e-app';
import { makeSeeders } from './helpers/seed';

jest.mock('ioredis', () => require('ioredis-mock'));

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      publish: jest.fn(),
      close: jest.fn(),
    }),
    on: jest.fn(),
    close: jest.fn(),
  }),
}));

describe('Internal Service', () => {
  const { getApp, serviceKey } = useTestApp();
  const { seedUser, seedOwnerAndMember } = makeSeeders(getApp);

  it('GET /api/internal/users/:id -> 200 with a valid service key', async () => {
    const { user } = await seedUser({
      displayName: 'Alice',
      email: 'alice@test.com',
    });

    const res = await request(getApp().getHttpServer())
      .get(`/api/internal/users/${user._id.toString()}`)
      .set('X-Service-Key', serviceKey)
      .expect(200);

    expect(res.body).toEqual({
      id: user._id.toString(),
      displayName: 'Alice',
      email: 'alice@test.com',
    });
    expect(res.body.role).toBe(undefined);
  });

  it('GET /api/internal/users/:id -> 401 without OR with a wrong key', async () => {
    const { user } = await seedUser();
    const id = user._id.toString();

    await request(getApp().getHttpServer())
      .get(`/api/internal/users/${id}`)
      .expect(401);
    await request(getApp().getHttpServer())
      .get(`/api/internal/users/${id}`)
      .set('X-Service-Key', 'wrong-service-key')
      .expect(401);
  });

  it('GET /api/internal/rooms/:id -> members without membership gating', async () => {
    const { owner, member, room } = await seedOwnerAndMember();

    const res = await request(getApp().getHttpServer())
      .get(`/api/internal/rooms/${room._id.toString()}`)
      .set('X-Service-Key', serviceKey)
      .expect(200);

    expect(res.body.name).toBe(room.name);
    expect([...res.body.memberIds].sort()).toEqual(
      [owner.user._id.toString(), member.user._id.toString()].sort(),
    );
  });
});
