import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen } from '@/test/render';
import { MessageListPage } from './MessageListPage';

const PENDING_ROOM = {
  id: 'room-pending',
  name: 'Holiday Party',
  inviteCode: 'ABC',
  creatorId: 'user-1',
  status: 'pending' as const,
  participants: [],
  participantCount: 4,
};

const DRAWN_ROOM = {
  id: 'room-drawn',
  name: 'Office Gift Exchange',
  inviteCode: 'XYZ',
  creatorId: 'user-1',
  status: 'drawn' as const,
  participants: [],
  participantCount: 3,
};

function renderPage() {
  return renderWithProviders(<MessageListPage />);
}

describe('MessageListPage', () => {
  it('shows skeleton placeholders while loading', () => {
    server.use(http.get('/api/rooms', () => new Promise(() => {})));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no drawn rooms exist', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [PENDING_ROOM],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no active chats/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no rooms at all', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no active chats/i)).toBeInTheDocument();
  });

  it('renders only drawn rooms as chat rows', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [PENDING_ROOM, DRAWN_ROOM],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );
    renderPage();

    await screen.findByText('Office Gift Exchange');
    expect(screen.queryByText('Holiday Party')).not.toBeInTheDocument();
  });

  it('shows participant count in each row', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [DRAWN_ROOM],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText('3 participants')).toBeInTheDocument();
  });

  it('each row links to /rooms/:id/messages', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [DRAWN_ROOM],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );
    renderPage();

    const link = await screen.findByRole('link', {
      name: /office gift exchange/i,
    });
    expect(link).toHaveAttribute('href', '/rooms/room-drawn/messages');
  });

  it('shows an error message when the API call fails', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
          { status: 500 },
        ),
      ),
    );
    renderPage();
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it('navigates to the room chat when a row is clicked', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [DRAWN_ROOM],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({ giftee: null, santa: null }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/messages" element={<MessageListPage />} />
        <Route path="/rooms/:roomId/messages" element={<div>Chat page</div>} />
      </Routes>,
      { route: '/messages' },
    );

    const link = await screen.findByRole('link', {
      name: /office gift exchange/i,
    });
    expect(link).toHaveAttribute('href', '/rooms/room-drawn/messages');
  });
});
