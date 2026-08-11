jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { setupTestDb, teardownTestDb } from './helpers/db';

/**
 * CORS REGRESSION TESTS.
 *
 * The browser only exercises CORS in deployed environments: locally the app
 * talks to this service through Vite's same-origin proxy, so a broken CORS
 * setup passes every other test and only breaks in production.
 */

// Must match CORS_ORIGIN in test/setup-env.ts.
const ORIGIN = 'http://localhost:5173';

/** Verbs the app actually serves, read off the live route table. */
function routedMethods(app: FastifyInstance): string[] {
  const printed = app.printRoutes({ commonPrefix: false });
  const methods = new Set<string>();

  for (const [, group] of printed.matchAll(/\(([A-Z, ]+)\)/g)) {
    for (const method of group.split(',')) {
      const verb = method.trim();

      // HEAD and OPTIONS are added by Fastify/@fastify/cors, not by our routes,
      // and are always permitted by the CORS spec itself.
      if (verb && verb !== 'HEAD' && verb !== 'OPTIONS') methods.add(verb);
    }
  }

  return [...methods].sort();
}

describe('CORS', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await setupTestDb();
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDb();
  });

  it('sends access-control-allow-origin on real (non-preflight) responses', async () => {
    // An unauthenticated GET is enough: the CORS hook runs regardless of the
    // status code, and it is the *response* header we care about here.
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications?page=1&limit=20',
      headers: { origin: ORIGIN },
    });

    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('allows every method the router serves', async () => {
    const methods = routedMethods(app);

    // Guard against the regex silently matching nothing and vacuously passing.
    expect(methods).toEqual(expect.arrayContaining(['GET', 'POST', 'PUT']));

    for (const method of methods) {
      const res = await app.inject({
        method: 'OPTIONS',
        url: '/api/messages/000000000000000000000000/reaction',
        headers: {
          origin: ORIGIN,
          'access-control-request-method': method,
          'access-control-request-headers': 'authorization,content-type',
        },
      });

      const allowed = (res.headers['access-control-allow-methods'] as string)
        .split(',')
        .map((m) => m.trim());

      expect(allowed).toContain(method);
    }
  });

  it('does not reflect an unknown origin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { origin: 'https://not-santa.example.com' },
    });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
