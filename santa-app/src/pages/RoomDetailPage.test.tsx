import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { RoomDetailPage } from './RoomDetailPage';

const TOKEN_KEY = 'santa.accessToken';

const FAKE_USER = {
  id: 'user-1',
  email: 'alice@test.com',
  displayName: 'Alice',
  role: 'user' as const,
};

const PENDING_ROOM = {
  id: 'room-1',
  name: 'Office Party',
  inviteCode: 'VALID',
  creatorId: 'user-1',
  status: 'pending' as const,
  participants: [
    { id: 'user-1', displayName: 'Alice', role: 'owner' as const },
    { id: 'user-2', displayName: 'Bob', role: 'member' as const },
    { id: 'user-3', displayName: 'Carol', role: 'member' as const },
  ],
  participantCount: 3,
  viewerPermissions: [
    'room:view',
    'room:draw',
    'room:invite',
    'room:kick',
    'room:edit',
    'room:delete',
    'wishlist:set',
  ] as const,
};

const DRAWN_ROOM = {
  ...PENDING_ROOM,
  status: 'drawn' as const,
  exchangeDate: '2025-12-24',
};

function renderRoom(roomId = 'room-1') {
  localStorage.setItem(TOKEN_KEY, 'fake-token');
  server.use(
    http.get('/api/users/me', () => HttpResponse.json(FAKE_USER)),
    http.get('/api/rooms/:id/wishlist/:userId', () =>
      HttpResponse.json({
        userId: 'user-1',
        roomId: 'room-1',
        items: ['Bicycle', 'Book'],
      }),
    ),
  );
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: `/rooms/${roomId}` },
  );
}

beforeEach(() => {
  localStorage.removeItem(TOKEN_KEY);
});

describe('RoomDetailPage', () => {
  it('fetches room by id and renders its name and invite code', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
    );
    renderRoom();
    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText(/VALID/)).toBeInTheDocument();
  });

  it('renders participant list', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
    );
    renderRoom();
    await screen.findByText('Office Party');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders status in description', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
    );
    renderRoom();
    await screen.findByText('Office Party');
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows Draw names button for owner with pending room and 3+ participants', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
    );
    renderRoom();
    expect(
      await screen.findByRole('button', { name: /draw names/i }),
    ).toBeInTheDocument();
  });

  it('shows existing wishlist items', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
    );
    renderRoom();
    await screen.findByText('Office Party');
    expect(await screen.findByText('Bicycle')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
  });

  it('shows exchange date for drawn room', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(DRAWN_ROOM)),
      http.get('/api/rooms/:id/assignment', () =>
        HttpResponse.json({
          receiver: {
            id: 'user-2',
            displayName: 'Bob',
            wishlist: ['Chocolate'],
          },
        }),
      ),
    );
    renderRoom();
    await screen.findByText('Office Party');
    expect(await screen.findByText(/wednesday.*24.*dec/i)).toBeInTheDocument();
  });

  it('shows error state when room not found', async () => {
    server.use(
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );
    renderRoom();
    expect(await screen.findByText(/room not found/i)).toBeInTheDocument();
  });

  it('Save wishlist button fires PUT /api/rooms/:id/wishlist and shows toast', async () => {
    let savedItems: unknown = null;
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(PENDING_ROOM)),
      http.put('/api/rooms/:id/wishlist', async ({ request }) => {
        savedItems = await request.json();
        return HttpResponse.json({
          userId: 'user-1',
          roomId: 'room-1',
          items: ['Bicycle'],
        });
      }),
    );
    renderRoom();
    await screen.findByText('Office Party');

    const user = userEvent.setup();
    const input = await screen.findByPlaceholderText(/one gift idea per line/i);
    await user.type(input, 'Bicycle');
    await user.click(screen.getByRole('button', { name: /save wishlist/i }));

    await waitFor(() => expect(savedItems).not.toBeNull());
    expect(await screen.findByText(/wishlist updated/i)).toBeInTheDocument();
  });

  it('shows giftee card for drawn room', async () => {
    server.use(
      http.get('/api/rooms/:id', () => HttpResponse.json(DRAWN_ROOM)),
      http.get('/api/rooms/:id/assignment', () =>
        HttpResponse.json({
          receiver: {
            id: 'user-2',
            displayName: 'Bob',
            wishlist: ['Chocolate'],
          },
        }),
      ),
    );
    renderRoom();
    await screen.findByText('Office Party');
    expect(await screen.findByText(/you're gifting/i)).toBeInTheDocument();
    expect(await screen.findByText('Chocolate')).toBeInTheDocument();
    // Giftee name is rendered inside a <strong> in "You're gifting Bob" sentence
    expect(
      await screen.findByText(
        (_, el) => el?.tagName === 'STRONG' && el.textContent === 'Bob',
      ),
    ).toBeInTheDocument();
  });
});
