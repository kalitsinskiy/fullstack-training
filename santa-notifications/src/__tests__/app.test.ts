import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

describe('buildApp', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('returns a fresh Fastify instance', () => {
    expect(app).toBeDefined();
    expect(typeof app.inject).toBe('function');
  });

  test('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  test('decorates fastify with config {port, env}', async () => {
    expect(app.hasDecorator('config')).toBe(true);
    expect(app.config).toEqual({
      port: expect.any(Number),
      env: expect.any(String),
    });
  });

  test('config respects PORT/NODE_ENV vars', async () => {
    const prev = { PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV };
    process.env.PORT = '4567';
    process.env.NODE_ENV = 'test';

    const isolated = await buildApp();
    await isolated.ready();
    expect(isolated.config).toEqual({ port: 4567, env: 'test' });

    await isolated.close();
    process.env.PORT = prev.PORT;
    process.env.NODE_ENV = prev.NODE_ENV;
  });

  describe('error handling', () => {
    test('404 handler returns custom shape with method and url', async () => {
      const res = await app.inject({ method: 'GET', url: '/noexistent' });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        error: 'Route GET /noexistent not found',
      });
    });

    test('404 includes the actual method (not hardcoded GET)', async () => {
      const res = await app.inject({ method: 'POST', url: '/also-missing' });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        error: 'Route POST /also-missing not found',
      });
    });

    test('validation error returns the standard error envelope', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/notifications',
        payload: {},
      });

      expect(res.statusCode).toBe(400);

      const body = res.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Request validation failed');
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBeGreaterThan(0);
    });

    test('NotFoundError returns 404 with NOT_FOUND code', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/notifications/9999' });

      expect(res.statusCode).toBe(404);

      const body = res.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(typeof body.error.message).toBe('string');
    });
  });

  describe('timing', () => {
    test('responses include X-Response-Time header on "<N>ms" format', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.headers['x-response-time']).toBeDefined();
      expect(res.headers['x-response-time']).toMatch(/^\d+ms$/);
    });

    test('header is present on error responses too', async () => {
      const res = await app.inject({ method: 'GET', url: '/nonexistent' });
      expect(res.headers['x-response-time']).toMatch(/^\d+ms$/);
    });

    test('header is present on validation errors', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/notification',
        payload: {},
      });
      expect(res.headers['x-response-time']).toMatch(/^\d+ms$/);
    });
  });
});
