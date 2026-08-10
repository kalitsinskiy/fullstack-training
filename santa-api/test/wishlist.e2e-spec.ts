import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useTestApp } from './helpers/e2e-app';
import { makeSeeders } from './helpers/seed';

describe('Wishlist (HTTP)', () => {
  const { getApp } = useTestApp();
  let app: NestFastifyApplication;
  beforeEach(() => {
    app = getApp();
  });
  const { seedUserAndRoom } = makeSeeders(getApp);

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

  it('GET /api/rooms/:roomId/wishlist/:userId -> 400 for a malformed userId', async () => {
    const { room, token } = await seedUserAndRoom();

    await request(app.getHttpServer())
      .get(`/api/rooms/${room._id.toString()}/wishlist/not-an-object-id`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('PUT /api/rooms/:roomId/wishlist -> 400 for a malformed roomId', async () => {
    const { token } = await seedUserAndRoom();

    await request(app.getHttpServer())
      .put('/api/rooms/not-an-object-id/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: ['socks'] })
      .expect(400);
  });
});
