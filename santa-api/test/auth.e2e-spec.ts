import request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useTestApp } from './helpers/e2e-app';

/**
 * COMPONENT TEST (HTTP slice) — the approach for this whole course.
 *
 * We boot the real AppModule against an in-memory MongoDB and drive it through
 * real HTTP with supertest. No mocking of services or the database: a request
 * goes through pipes → guards → controller → service → Mongo, exactly like prod.
 *
 * One example below is fully written so you can see the wiring. The rest are
 * `it.todo(...)` — turn each into a real test as you implement AuthService.
 * Add more scenarios as you find edge cases; this list is a floor, not a ceiling.
 */
describe('Auth (HTTP)', () => {
  const { getApp } = useTestApp();
  let app: NestFastifyApplication;
  beforeEach(() => {
    app = getApp();
  });

  // ✅ WORKED EXAMPLE — green against the skeleton: validation runs in the
  // ValidationPipe, before AuthService is ever called. Study this wiring, then
  // implement the service and fill in the `it.todo`s below the same way.
  it('POST /api/auth/register → 400 when required fields are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'alice@test.com' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: expect.any(Array) as string[],
    });
  });

  // 👇 Implement AuthService, then turn each of these into a real test.
  it('POST /api/auth/register → 201 returns { id, email, displayName, accessToken }', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'Alice@Example.com',
        password: 'secret123',
        displayName: 'Alice',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      email: 'alice@example.com',
      displayName: 'Alice',
      accessToken: expect.any(String),
    });

    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register → 409 when the email is already registered', async () => {
    const payload = {
      email: 'alice@test.com',
      password: 'secret123',
      displayName: 'bob',
    };

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(409);

    expect(res.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: 'Email is already registered',
    });
  });

  it('POST /api/auth/login → 200 returns an accessToken for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alice@example.com',
        password: 'secret123',
        displayName: 'Alice',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secret123' })
      .expect(200);

    expect(res.body).toEqual({ accessToken: expect.any(String) });
  });

  it('POST /api/auth/login → 401 with the SAME generic message for a wrong password AND an unknown email', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'secret123',
      displayName: 'Alice',
    });

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'WRONG12345' })
      .expect(401);

    const unknownEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' })
      .expect(401);

    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });
});
