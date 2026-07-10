import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomListPage } from './RoomListPage';

describe('RoomListPage', () => {
  it('renders the room cards from the API', async () => {
    renderWithProviders(<RoomListPage />, { route: '/rooms' });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText(/3 participants/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows the empty state when there are no rooms', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
        }),
      ),
    );

    renderWithProviders(<RoomListPage />, { route: '/rooms' });

    expect(await screen.findByText(/no rooms yet/i)).toBeInTheDocument();
  });
});
