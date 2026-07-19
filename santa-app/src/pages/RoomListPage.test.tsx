import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { RoomListPage } from './RoomListPage';

const API = import.meta.env.VITE_API_URL ?? '';

const ROOMS_RESPONSE = {
  data: [
    { id: 'room-1', name: 'Office Party', status: 'pending', participantCount: 3, inviteCode: 'ABC123' },
    { id: 'room-2', name: 'Family Gift', status: 'drawn', participantCount: 5, inviteCode: 'DEF456' },
  ],
  meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
};

describe('RoomListPage', () => {
  it('shows a loading state while rooms are being fetched', async () => {
    server.use(
      http.get(`${API}/api/rooms`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
      }),
    );

    renderWithProviders(<RoomListPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the room list after the API resolves', async () => {
    server.use(
      http.get(`${API}/api/rooms`, () => HttpResponse.json(ROOMS_RESPONSE)),
    );

    renderWithProviders(<RoomListPage />);

    await waitFor(() => {
      expect(screen.getByText('Office Party')).toBeInTheDocument();
      expect(screen.getByText('Family Gift')).toBeInTheDocument();
    });
  });

  it('shows the empty state when there are no rooms', async () => {
    server.use(
      http.get(`${API}/api/rooms`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      ),
    );

    renderWithProviders(<RoomListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no rooms/i)).toBeInTheDocument();
    });
  });

  it('renders the create room and join room forms', () => {
    renderWithProviders(<RoomListPage />);

    expect(screen.getByText(/create a room/i)).toBeInTheDocument();
    expect(screen.getByText(/join with an invite/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/room name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/invite code/i)).toBeInTheDocument();
  });
});
