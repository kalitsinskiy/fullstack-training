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

  http.post('/api/auth/register', () =>
    HttpResponse.json(
      {
        id: 'test-id',
        email: 'new@test.com',
        displayName: 'New User',
        accessToken: 'test-token',
      },
      { status: 201 },
    ),
  ),

  http.get('/api/notifications', () =>
    HttpResponse.json({
      data: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  ),
];
