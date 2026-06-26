import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3001';

export const ME = {
  id: 'u1',
  email: 'me@example.com',
  name: 'Me',
};

export const sampleRoom = {
  id: 'r1',
  name: 'Office Party',
  ownerId: 'u1',
  code: 'ABC123',
  members: ['u1', 'u2', 'u3'],
  status: 'pending' as const,
  exchangePlace: '',
  createdAt: '2026-06-06T00:00.000Z',
};

export const server = setupServer(
  // --- Auth ---
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string };

    if (email === 'wrong@example.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return HttpResponse.json({ accessToken: 'fake-token' });
  }),
  http.post(`${BASE_URL}/api/auth/register`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string };

    if (email === 'registered@example.com') {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    return HttpResponse.json(
      { id: 'u9', email, displayName: 'New', accessToken: 'fake-token' },
      { status: 201 }
    );
  }),
  http.get(`${BASE_URL}/api/users/me`, () => HttpResponse.json(ME)),

  // --- Rooms ---
  http.get(`${BASE_URL}/api/rooms`, () =>
    HttpResponse.json({
      data: [sampleRoom],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    })
  ),
  http.get(`${BASE_URL}/api/rooms/:id`, ({ params }) =>
    params.id === sampleRoom.id
      ? HttpResponse.json(sampleRoom)
      : new HttpResponse(null, { status: 404 })
  ),
  http.post(`${BASE_URL}/api/rooms`, async ({ request }) => {
    const { name } = (await request.json()) as { name: string };
    return HttpResponse.json({ ...sampleRoom, id: 'rNew', name }, { status: 201 });
  }),
  http.post(`${BASE_URL}/api/rooms/:code/join`, () => HttpResponse.json(sampleRoom)),
  http.post(`${BASE_URL}/api/rooms/:id/draw`, () =>
    HttpResponse.json({ ...sampleRoom, status: 'drawn' })
  ),
  http.patch(`${BASE_URL}/api/rooms/:id`, async ({ request }) => {
    const body = (await request.json()) as { exchangeDate: string; exchangePlace: string };
    return HttpResponse.json({ ...sampleRoom, status: 'drawn', ...body });
  }),
  http.delete(`${BASE_URL}/api/rooms/:id`, () => new HttpResponse(null, { status: 204 })),

  // --- Wishlist ---
  http.get(
    `${BASE_URL}/api/rooms/:roomId/wishlist/:userId`,
    () => new HttpResponse(null, { status: 404 })
  ),
  http.post(`${BASE_URL}/api/rooms/:roomId/wishlist`, async ({ request }) => {
    const { items } = (await request.json()) as { items: unknown[] };
    return HttpResponse.json({ roomId: 'r1', userId: 'u1', items });
  })
);
