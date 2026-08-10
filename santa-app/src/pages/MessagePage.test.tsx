import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { MessagesPage } from './MessagesPage';

describe('MessagesPage', () => {
  it('shows an error, when the rooms fetch fails', async () => {
    server.use(
      http.get('/api/rooms', () => new HttpResponse(null, { status: 500 })),
    );

    renderWithProviders(<MessagesPage />);

    expect(
      await screen.findByText(/could not load your chats/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/no chats yet/i)).not.toBeInTheDocument();
  });

  it('lists drawn rooms and highlights ones with unread messages', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [
            {
              id: 'r1',
              name: 'Office Party',
              status: 'drawn',
              participantCount: 3,
            },
            {
              id: 'r2',
              name: 'Family Santa',
              status: 'drawn',
              participantCount: 4,
            },
          ],
          meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
        }),
      ),

      http.get('/api/messages/unread', () =>
        HttpResponse.json({ total: 3, rooms: [{ roomId: 'r1', count: 3 }] }),
      ),
    );

    renderWithProviders(<MessagesPage />, { route: '/messages' });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(
      await screen.findByLabelText('3 unread messages'),
    ).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('No unread messages')).toBeInTheDocument();
  });

  it('hides rooms that have not been drawn', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [
            {
              id: 'r3',
              name: 'Pending Room',
              status: 'pending',
              participantCount: 2,
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      ),
    );

    renderWithProviders(<MessagesPage />, { route: '/messages' });

    expect(await screen.findByText(/no chats yet/i)).toBeInTheDocument();
    expect(screen.queryByText('Pending Room')).not.toBeInTheDocument();
  });
});
