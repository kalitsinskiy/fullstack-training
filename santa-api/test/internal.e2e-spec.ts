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
  const { seedUser, seedOwnerAndMember, seedDrawableRoom } =
    makeSeeders(getApp);

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

  it('GET /api/internal/rooms/:roomId/relations/:userId -> both edges for a drawn room', async () => {
    const { owner, m1, m2, room } = await seedDrawableRoom();
    const id = room._id.toString();

    await request(getApp().getHttpServer())
      .post(`/api/rooms/${id}/draw`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ exchangeDate: '2026-12-24' })
      .expect(200);

    const me = owner.user._id.toString();
    const res = await request(getApp().getHttpServer())
      .get(`/api/internal/rooms/${id}/relations/${me}`)
      .set('X-Service-Key', serviceKey)
      .expect(200);

    const others = [m1.user._id.toString(), m2.user._id.toString()];

    expect(others).toContain(res.body.gifteeId);
    expect(others).toContain(res.body.santaId);
    expect(res.body.gifteeId).not.toBe(me);
    expect(res.body.santaId).not.toBe(me);
  });

  it('GET /api/internal/rooms/:roomId/relations/:userId -> both relations are null when the room has not been drawn', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const res = await request(getApp().getHttpServer())
      .get(
        `/api/internal/rooms/${room._id.toString()}/relations/${owner.user._id.toString()}`,
      )
      .set('X-Service-Key', serviceKey)
      .expect(200);

    expect(res.body).toEqual({ gifteeId: null, santaId: null });
  });

  it('GET /api/internal/rooms/:roomId/relations/:userId -> 401 without OR with a wrong service key', async () => {
    const { owner, room } = await seedOwnerAndMember();
    const url = `/api/internal/rooms/${room._id.toString()}/relations/${owner.user._id.toString()}`;

    await request(getApp().getHttpServer()).get(url).expect(401);
    await request(getApp().getHttpServer())
      .get(url)
      .set('X-Service-Key', 'wrong')
      .expect(401);
  });
});
