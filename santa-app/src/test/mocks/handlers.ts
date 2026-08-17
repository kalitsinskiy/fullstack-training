import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers. Add one per endpoint your tests touch, then override
 * per-test with `server.use(...)` for error/edge cases.
 *
 * Note: in tests `VITE_API_URL` is unset, so axios issues *relative* URLs.
 * Match them with a leading slash, e.g. '/api/auth/login'.
 */
export const handlers = [
  // Auth
  http.post('/api/auth/login', () =>
    HttpResponse.json({ accessToken: 'test-token' }),
  ),

  http.post('/api/auth/register', () =>
    HttpResponse.json(
      {
        accessToken: 'test-token',
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
      },
      { status: 201 },
    ),
  ),

  // Users
  http.get('/api/users/me', () =>
    HttpResponse.json({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    }),
  ),

  http.patch('/api/users/me', () =>
    HttpResponse.json({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Updated Name',
      role: 'user',
    }),
  ),

  http.delete('/api/users/me', () => new HttpResponse(null, { status: 204 })),

  // Rooms
  http.get('/api/rooms', () =>
    HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    }),
  ),

  http.get('/api/rooms/:id', () =>
    HttpResponse.json({
      id: 'room-1',
      name: 'Test Room',
      inviteCode: 'ABC123',
      creatorId: 'user-1',
      status: 'pending',
      participants: [
        { id: 'user-1', displayName: 'Test User', role: 'owner' },
        { id: 'user-2', displayName: 'Another User', role: 'member' },
      ],
      participantCount: 2,
      viewerPermissions: [
        'room:view',
        'room:draw',
        'room:invite',
        'room:kick',
        'room:edit',
        'room:delete',
        'wishlist:set',
      ],
    }),
  ),

  http.post('/api/rooms', () =>
    HttpResponse.json(
      {
        id: 'room-new',
        name: 'New Room',
        inviteCode: 'XYZ789',
        creatorId: 'user-1',
        status: 'pending',
        participants: [],
        participantCount: 1,
      },
      { status: 201 },
    ),
  ),

  http.post('/api/rooms/join', () =>
    HttpResponse.json({ id: 'room-joined', name: 'Joined Room' }),
  ),

  http.put('/api/rooms/:id/wishlist', () =>
    HttpResponse.json({ userId: 'user-1', roomId: 'room-1', items: ['item1'] }),
  ),

  http.get('/api/rooms/:id/wishlist/:userId', () =>
    HttpResponse.json({
      userId: 'user-1',
      roomId: 'room-1',
      items: ['Socks', 'Book'],
    }),
  ),

  http.get('/api/rooms/:id/assignment', () =>
    HttpResponse.json({
      receiver: {
        id: 'user-2',
        displayName: 'Another User',
        wishlist: ['Chocolate'],
      },
    }),
  ),

  http.post('/api/rooms/:id/draw', () => HttpResponse.json({ success: true })),

  // Messages
  http.get('/api/messages/:roomId', () =>
    HttpResponse.json({
      giftee: { id: 'user-2', name: 'Bob', messages: [] },
      santa: { messages: [] },
    }),
  ),

  http.post('/api/messages', () =>
    HttpResponse.json(
      {
        id: 'msg-1',
        roomId: 'room-1',
        text: 'Hope you like it!',
        createdAt: new Date('2024-12-01T10:00:00Z').toISOString(),
        direction: 'out',
        thread: 'giftee',
      },
      { status: 201 },
    ),
  ),

  // Notifications
  http.get('/api/notifications', () =>
    HttpResponse.json({
      data: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      limit: 20,
    }),
  ),

  http.patch('/api/notifications/:id/read', ({ params }) =>
    HttpResponse.json({
      id: params.id,
      userId: 'user-1',
      type: 'user.joined',
      message: 'Alice joined "Test Room"',
      read: true,
      createdAt: new Date().toISOString(),
    }),
  ),

  http.patch('/api/notifications/read-all', () =>
    HttpResponse.json({ success: true }),
  ),
];
