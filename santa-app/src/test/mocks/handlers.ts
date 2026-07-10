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
        id: 'u1',
        email: 'alice@example.com',
        displayName: 'Alice',
        accessToken: 'test-token',
      },
      { status: 201 },
    ),
  ),

  http.get('/api/users/me', () =>
    HttpResponse.json({
      id: 'u1',
      email: 'alice@example.com',
      displayName: 'Alice',
      role: 'user',
    }),
  ),

  http.get('/api/rooms', () =>
    HttpResponse.json({
      data: [
        {
          id: 'r1',
          name: 'Office Party',
          status: 'pending',
          participantCount: 3,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
  ),

  http.post('/api/rooms', () =>
    HttpResponse.json(
      {
        id: 'r1',
        name: 'Office Party',
        inviteCode: 'ABC123',
        creatorId: 'u1',
        status: 'pending',
        participants: [],
        participantCount: 1,
      },
      { status: 201 },
    ),
  ),

  http.post('/api/rooms/join', () =>
    HttpResponse.json(
      {
        id: 'r1',
        name: 'Office Party',
        inviteCode: 'ABC123',
        creatorId: 'u2',
        status: 'pending',
        participants: [],
        participantCount: 2,
      },
      { status: 201 },
    ),
  ),

  http.get('/api/rooms/:id', () =>
    HttpResponse.json(
      {
        id: 'r1',
        name: 'Office Party',
        inviteCode: 'ABC123',
        creatorId: 'u1',
        status: 'pending',
        participantCount: 2,
        participants: [
          { id: 'u1', displayName: 'Alice', role: 'owner' },
          { id: 'u2', displayName: 'Alex', role: 'member' },
        ],
      },
      { status: 200 },
    ),
  ),

  http.get('/api/rooms/:roomId/wishlist/:userId', () =>
    HttpResponse.json({ roomId: 'r1', userId: 'u1', items: [] }),
  ),

  http.put('/api/rooms/:roomId/wishlist', async ({ request }) => {
    const body = (await request.json()) as { items: string[] };

    return HttpResponse.json({ roomId: 'r1', userId: 'u1', items: body.items });
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const body = (await request.json()) as { displayName: string };
    return HttpResponse.json({
      id: 'u1',
      email: 'alice@test.com',
      displayName: body.displayName,
      role: 'user',
    });
  }),
];
