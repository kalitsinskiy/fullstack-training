import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Must match VITE_API_URL in .env — jsdom's default location origin doesn't
// match it, so relative MSW paths would resolve against the wrong origin.
export const API_URL = 'http://localhost:3001';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
}

export const ALICE: TestUser = {
  id: 'user-1',
  email: 'alice@test.com',
  password: 'password1',
  displayName: 'Alice',
};

export const BOB: TestUser = {
  id: 'user-2',
  email: 'bob@test.com',
  password: 'password2',
  displayName: 'Bob',
};

const KNOWN_USERS = [ALICE, BOB];

export function tokenFor(email: string) {
  return `fake-token:${email}`;
}

export interface TestRoom {
  _id: string;
  name: string;
  inviteCode: string;
  participants: string[];
  status: 'pending' | 'drawn';
  creatorId: string;
}

// Both rooms have 3 participants — enough to exercise the "Trigger Draw" flow.
export const ROOM_OFFICE: TestRoom = {
  _id: 'room-1',
  name: 'Office Party',
  inviteCode: 'ABC123',
  participants: [ALICE.id, BOB.id, 'user-3'],
  status: 'pending',
  creatorId: ALICE.id,
};

export const ROOM_FAMILY: TestRoom = {
  _id: 'room-2',
  name: 'Family Exchange',
  inviteCode: 'XYZ789',
  participants: [ALICE.id, BOB.id, 'user-3'],
  status: 'drawn',
  creatorId: ALICE.id,
};

export const ROOMS: TestRoom[] = [ROOM_OFFICE, ROOM_FAMILY];

export const handlers = [
  // ---- Auth ----
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string; password: string };
    if (email === 'wrong@test.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const known = KNOWN_USERS.find((u) => u.email === email);
    return HttpResponse.json({ accessToken: tokenFor(known?.email ?? email) });
  }),

  http.post(`${API_URL}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      displayName: string;
    };
    if (body.email === 'taken@test.com') {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    return HttpResponse.json(
      {
        id: 'user-new',
        email: body.email,
        displayName: body.displayName,
        accessToken: tokenFor(body.email),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/api/users/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = auth.replace('Bearer ', '');
    const email = token.startsWith('fake-token:') ? token.slice('fake-token:'.length) : '';
    const user = KNOWN_USERS.find((u) => u.email === email);
    if (user) return HttpResponse.json({ id: user.id, email: user.email, displayName: user.displayName });

    // Freshly registered users aren't in KNOWN_USERS — echo back a generic profile.
    return HttpResponse.json({ id: 'user-new', email, displayName: 'New User' });
  }),

  // ---- Rooms ----
  http.get(`${API_URL}/api/rooms`, () =>
    HttpResponse.json({
      data: ROOMS,
      meta: { total: ROOMS.length, page: 1, limit: 10, totalPages: 1 },
    }),
  ),

  http.get(`${API_URL}/api/rooms/:id`, ({ params }) => {
    const room = ROOMS.find((r) => r._id === params.id);
    if (!room) return HttpResponse.json({ message: 'Room not found' }, { status: 404 });
    return HttpResponse.json(room);
  }),

  http.post(`${API_URL}/api/rooms`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(
      {
        _id: 'room-new',
        name: body.name,
        inviteCode: 'NEWCOD',
        participants: [ALICE.id],
        status: 'pending',
        creatorId: ALICE.id,
      },
      { status: 201 },
    );
  }),

  http.post(`${API_URL}/api/rooms/:code/join`, ({ params }) => {
    const room = ROOMS.find((r) => r.inviteCode === params.code);
    if (!room) return HttpResponse.json({ message: 'Room not found' }, { status: 404 });
    if (room.status === 'drawn') {
      return HttpResponse.json(
        { message: 'Cannot join a room that has already been drawn' },
        { status: 403 },
      );
    }
    return HttpResponse.json(room, { status: 201 });
  }),

  http.post(`${API_URL}/api/rooms/:id/draw`, ({ params }) => {
    const room = ROOMS.find((r) => r._id === params.id);
    if (!room) return HttpResponse.json({ message: 'Room not found' }, { status: 404 });
    return HttpResponse.json({ ...room, status: 'drawn' }, { status: 201 });
  }),

  // ---- Wishlist ----
  // Default: no wishlist saved yet.
  http.get(`${API_URL}/api/rooms/:roomId/wishlist/:userId`, () =>
    HttpResponse.json({ message: 'Wishlist not found' }, { status: 404 }),
  ),

  http.post(`${API_URL}/api/rooms/:roomId/wishlist`, async ({ request }) => {
    const body = (await request.json()) as { items: unknown[] };
    return HttpResponse.json({ items: body.items }, { status: 201 });
  }),

  // ---- Assignment (default: draw hasn't happened yet) ----
  http.get(`${API_URL}/api/rooms/:id/assignment`, () =>
    HttpResponse.json({ message: 'Draw has not been run yet' }, { status: 404 }),
  ),

  http.get(`${API_URL}/api/rooms/:id/assignment/wishlist`, () =>
    HttpResponse.json({ message: 'Draw has not been run yet' }, { status: 404 }),
  ),
];

export const server = setupServer(...handlers);
