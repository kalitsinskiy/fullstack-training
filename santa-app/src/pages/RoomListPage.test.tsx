import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomListPage } from './RoomListPage';

const paginated = (data: unknown[]) => ({
  data,
  meta: { total: data.length, page: 1, limit: 10, totalPages: 1 },
});

describe('RoomListPage', () => {
  it('shows a loading state initially', () => {
    server.use(http.get('/api/rooms', () => HttpResponse.json(paginated([]))));
    renderWithProviders(<RoomListPage />);
    expect(screen.getByText(/loading rooms/i)).toBeInTheDocument();
  });

  it('renders the room list once the API resolves', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json(
          paginated([
            { id: '1', name: 'Office Party', status: 'pending', participantCount: 3, budget: 500, currency: '₴' },
            { id: '2', name: 'Family Christmas', status: 'drawn', participantCount: 5 },
          ]),
        ),
      ),
    );
    renderWithProviders(<RoomListPage />);

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText('Family Christmas')).toBeInTheDocument();
    // budget chip shows for the room that has one
    expect(screen.getByText('₴500')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rooms', async () => {
    server.use(http.get('/api/rooms', () => HttpResponse.json(paginated([]))));
    renderWithProviders(<RoomListPage />);

    expect(await screen.findByText(/no rooms yet/i)).toBeInTheDocument();
  });
});
