import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers. Add one per endpoint your tests touch, then override
 * per-test with `server.use(...)` for error/edge cases.
 *
 * Note: in tests `VITE_API_URL` is unset, so axios issues *relative* URLs.
 * Match them with a leading slash, e.g. '/api/auth/login'.
 */
export const handlers = [
  // Example handler — a successful login.
  http.post('/api/auth/login', () =>
    HttpResponse.json({ accessToken: 'test-token' }),
  ),
  // The auth provider may hydrate the current user once a token appears.
  http.get('/api/users/me', () =>
    HttpResponse.json({ id: 'me', email: 'me@test.com', displayName: 'Me', role: 'user' }),
  ),
];
