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

  http.get('/api/notifications', ({ request }) => {
    const limit = new URL(request.url).searchParams.get('limit');
    const data = [
      {
        id: 'n1',
        userId: 'u1',
        roomId: 'r1',
        type: 'user.joined',
        message: 'Bob joined "Office Party"',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'n2',
        userId: 'u1',
        roomId: 'r1',
        type: 'draw.completed',
        message: 'The draw for "Office Party" is complete!',
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];

    return HttpResponse.json({
      data: limit === '1' ? data.slice(0, 1) : data,
      total: 2,
      unreadCount: 1,
      page: 1,
      limit: Number(limit ?? 20),
    });
  }),

  http.patch('/api/notifications/:id/read', ({ params }) =>
    HttpResponse.json({
      id: params.id,
      userId: 'u1',
      type: 'user.joined',
      message: 'Bob joined the room',
      read: true,
      createdAt: new Date().toISOString(),
    }),
  ),

  http.get('/api/messages/unread', () =>
    HttpResponse.json({ total: 3, rooms: [{ roomId: 'r1', count: 3 }] }),
  ),

  http.get('/api/messages/:roomId', () =>
    HttpResponse.json({
      giftee: {
        id: 'u2',
        name: 'Bob',
        messages: [
          {
            id: 'm1',
            text: 'hope you like puzzles!',
            createdAt: new Date().toISOString(),
            direction: 'out',
            read: false,
            myReaction: null,
            theirReaction: null,
          },
          {
            id: 'm2',
            text: 'I do!',
            createdAt: new Date().toISOString(),
            direction: 'in',
            myReaction: null,
            theirReaction: null,
          },
        ],
      },
      santa: {
        messages: [
          {
            id: 'm3',
            text: 'guess who',
            createdAt: new Date().toISOString(),
            direction: 'in',
            myReaction: null,
            theirReaction: null,
          },
        ],
      },
    }),
  ),

  http.post('/api/messages', async ({ request }) => {
    const body = (await request.json()) as {
      roomId: string;
      to: string;
      text: string;
    };
    return HttpResponse.json(
      {
        id: 'm9',
        text: body.text,
        createdAt: new Date().toISOString(),
        direction: 'out',
        read: false,
        myReaction: null,
        theirReaction: null,
        thread: body.to,
      },
      { status: 201 },
    );
  }),

  http.patch('/api/messages/:roomId/read', () =>
    HttpResponse.json({ updated: 3 }),
  ),

  http.put('/api/messages/:id/reaction', async ({ request, params }) => {
    const { emoji } = (await request.json()) as { emoji: string | null };

    return HttpResponse.json({
      id: String(params.id),
      text: 'hope you like puzzles!',
      createdAt: new Date().toISOString(),
      direction: 'out',
      read: false,
      myReaction: emoji,
      theirReaction: null,
    });
  }),
];
