import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomListPage } from './RoomListPage';
import userEvent from '@testing-library/user-event';

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

  it('shows the loading skeleton before the rooms attached to the DOM', async () => {
    renderWithProviders(<RoomListPage />, { route: '/rooms' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the error state with a retry that refetches', async () => {
    let calls = 0;

    server.use(
      http.get('/api/rooms', () => {
        calls++;

        if (calls === 1) {
          return new HttpResponse(null, { status: 500 });
        }

        return HttpResponse.json({
          data: [
            {
              id: 'r1',
              name: 'Office Party',
              status: 'pending',
              participantCunt: 3,
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        });
      }),
    );

    renderWithProviders(<RoomListPage />, { route: '/rooms' });

    expect(
      await screen.findByText(/couldn't load your rooms/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(
      screen.queryByText(/couldn't load your rooms/i),
    ).not.toBeInTheDocument();
  });
});
