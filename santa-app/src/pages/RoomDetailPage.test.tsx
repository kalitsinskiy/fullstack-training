import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { AuthProvider } from '@/features/auth/AuthContext';
import { screen, waitFor } from '@testing-library/react';
import { RoomDetailPage } from './RoomDetailPage';

const API = import.meta.env.VITE_API_URL ?? '';

const OWNER_USER = { id: 'user-1', email: 'owner@test.com', displayName: 'Alice', role: 'user' as const };

const PENDING_ROOM = {
  id: 'room-1',
  name: 'Office Secret Santa',
  inviteCode: 'XMAS99',
  creatorId: 'user-1',
  status: 'pending' as const,
  participants: [
    { id: 'user-1', displayName: 'Alice', role: 'owner' as const },
    { id: 'user-2', displayName: 'Bob', role: 'member' as const },
  ],
  participantCount: 2,
  viewerPermissions: ['room:view', 'room:draw', 'room:invite', 'room:kick', 'room:edit', 'room:delete', 'wishlist:set'],
};

const DRAWN_ROOM = {
  ...PENDING_ROOM,
  status: 'drawn' as const,
};

const WISHLIST = { userId: 'user-1', roomId: 'room-1', items: ['Book', 'Coffee'] };

function renderRoomDetail(roomId = 'room-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/rooms/${roomId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RoomDetailPage', () => {
  it('shows loading state initially', () => {
    server.use(
      http.get(`${API}/api/rooms/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(PENDING_ROOM);
      }),
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
      http.get(`${API}/api/rooms/:id/wishlist/:userId`, () => HttpResponse.json(WISHLIST)),
    );

    renderRoomDetail();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows room not found when the room does not exist', async () => {
    server.use(
      http.get(`${API}/api/rooms/:id`, () => HttpResponse.json({ message: 'Not found' }, { status: 404 })),
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
    );

    renderRoomDetail('nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/room not found/i)).toBeInTheDocument();
    });
  });

  it('renders room name and members after loading', async () => {
    server.use(
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
      http.get(`${API}/api/rooms/:id`, () => HttpResponse.json(PENDING_ROOM)),
      http.get(`${API}/api/rooms/:id/wishlist/:userId`, () => HttpResponse.json(WISHLIST)),
    );

    renderRoomDetail();

    await waitFor(() => {
      expect(screen.getByText('Office Secret Santa')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the invite code for the room', async () => {
    server.use(
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
      http.get(`${API}/api/rooms/:id`, () => HttpResponse.json(PENDING_ROOM)),
      http.get(`${API}/api/rooms/:id/wishlist/:userId`, () => HttpResponse.json(WISHLIST)),
    );

    renderRoomDetail();

    await waitFor(() => {
      expect(screen.getByDisplayValue('XMAS99')).toBeInTheDocument();
    });
  });

  it('shows the draw button for the room owner on a pending room', async () => {
    server.use(
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
      http.get(`${API}/api/rooms/:id`, () => HttpResponse.json(PENDING_ROOM)),
      http.get(`${API}/api/rooms/:id/wishlist/:userId`, () => HttpResponse.json(WISHLIST)),
    );

    renderRoomDetail();

    await waitFor(() => {
      expect(screen.getByText(/draw names/i)).toBeInTheDocument();
    });
  });

  it('shows the assignment card when the room status is drawn', async () => {
    const assignment = { receiver: { id: 'user-2', displayName: 'Bob', wishlist: ['Socks'] } };

    server.use(
      http.get(`${API}/api/users/me`, () => HttpResponse.json(OWNER_USER)),
      http.get(`${API}/api/rooms/:id`, () => HttpResponse.json(DRAWN_ROOM)),
      http.get(`${API}/api/rooms/:id/assignment`, () => HttpResponse.json(assignment)),
      http.get(`${API}/api/rooms/:id/wishlist/:userId`, () => HttpResponse.json(WISHLIST)),
    );

    renderRoomDetail();

    await waitFor(() => {
      expect(screen.getByText(/you're gifting/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });
});
