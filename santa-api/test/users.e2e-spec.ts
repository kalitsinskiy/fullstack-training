import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useTestApp } from './helpers/e2e-app';
import { makeSeeders } from './helpers/seed';

describe('Users (HTTP)', () => {
  const { getApp } = useTestApp();
  let app: NestFastifyApplication;
  beforeEach(() => {
    app = getApp();
  });
  const { seedUser } = makeSeeders(getApp);

  it('GET /api/users/me → 200 returns the caller profile { id, displayName, email, role }', async () => {
    const { user, token } = await seedUser({ displayName: 'Alice' });

    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: user._id.toString(),
      displayName: 'Alice',
      email: user.email,
      role: 'user',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('GET /api/users/me → 401 without a token', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('PATCH /api/users/me → 200 updates the displayName', async () => {
    const { user, token } = await seedUser({ displayName: 'Old Name' });

    const response = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'New Name' })
      .expect(200);

    expect(response.body).toEqual({
      id: user._id.toString(),
      displayName: 'New Name',
      email: user.email,
      role: 'user',
    });

    const after = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(after.body.displayName).toBe('New Name');
  });

  it('PATCH /api/users/me → 400 on an invalid displayName', async () => {
    const { token } = await seedUser();

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: '' })
      .expect(400);
  });
});
