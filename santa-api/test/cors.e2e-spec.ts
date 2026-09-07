import { FastifyInstance } from 'fastify';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { useTestApp } from './helpers/e2e-app';

/**
 * CORS REGRESSION TESTS — the santa-api counterpart of santa-notifications'
 * test/cors.test.ts.
 *
 * The browser only exercises CORS in deployed environments: locally the app
 * talks to this service through Vite's same-origin proxy, so a broken CORS
 * setup passes every other test and only breaks in production.
 */

// configure-app.ts falls back to this when CORS_ORIGIN is unset, as it is here.
const ORIGIN = 'http://localhost:5173';

// Any path works — @fastify/cors answers preflights on a wildcard OPTIONS route.
const PREFLIGHT_URL = '/api/rooms';

/** Verbs the app actually serves, read off the live route table. */
function routedMethods(fastify: FastifyInstance): string[] {
  const printed = fastify.printRoutes({ commonPrefix: false });
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

describe('CORS (HTTP)', () => {
  const { getApp } = useTestApp();
  let app: NestFastifyApplication;
  let fastify: FastifyInstance;

  beforeEach(() => {
    app = getApp();
    fastify = app.getHttpAdapter().getInstance();
  });

  it('sends access-control-allow-origin on real (non-preflight) responses', async () => {
    // An unauthenticated GET is enough: the CORS hook runs regardless of the
    // status code, and it is the *response* header we care about here.
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/rooms',
      headers: { origin: ORIGIN },
    });

    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('allows every method the router serves', async () => {
    const methods = routedMethods(fastify);

    // Guard against the regex silently matching nothing and vacuously passing.
    expect(methods).toEqual(expect.arrayContaining(['GET', 'POST']));

    for (const method of methods) {
      const res = await fastify.inject({
        method: 'OPTIONS',
        url: PREFLIGHT_URL,
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

  it('allows the headers the client actually sends', async () => {
    const res = await fastify.inject({
      method: 'OPTIONS',
      url: PREFLIGHT_URL,
      headers: {
        origin: ORIGIN,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization,content-type',
      },
    });

    const allowed = (res.headers['access-control-allow-headers'] as string)
      .toLowerCase()
      .split(',')
      .map((h) => h.trim());

    expect(allowed).toEqual(
      expect.arrayContaining(['authorization', 'content-type']),
    );
  });

  it('does not reflect an unknown origin', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/rooms',
      headers: { origin: 'https://not-santa.example.com' },
    });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
