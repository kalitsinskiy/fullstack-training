import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen } from '@/test/render';
import { MessagesPage } from './MessagesPage';

const BASE_RESPONSE = {
  giftee: {
    id: 'user-2',
    name: 'Bob',
    messages: [
      {
        id: 'msg-1',
        roomId: 'room-1',
        text: 'Hope you like puzzles!',
        createdAt: new Date('2024-12-01T10:00:00Z').toISOString(),
        direction: 'out' as const,
      },
      {
        id: 'msg-2',
        roomId: 'room-1',
        text: 'Thanks for the hint!',
        createdAt: new Date('2024-12-01T11:00:00Z').toISOString(),
        direction: 'in' as const,
      },
    ],
  },
  santa: {
    messages: [
      {
        id: 'msg-3',
        roomId: 'room-1',
        text: 'Do you like books?',
        createdAt: new Date('2024-12-01T09:00:00Z').toISOString(),
        direction: 'in' as const,
      },
    ],
  },
};

function renderPage(roomId = 'room-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:roomId/messages" element={<MessagesPage />} />
    </Routes>,
    { route: `/rooms/${roomId}/messages` },
  );
}

describe('MessagesPage', () => {
  it('shows skeleton placeholders while loading', () => {
    server.use(http.get('/api/messages/:roomId', () => new Promise(() => {})));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when both threads are null (room not drawn)', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({ giftee: null, santa: null }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('shows an error message when the API call fails', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
  });

  it('renders the giftee tab with the giftee name', async () => {
    server.use(
      http.get('/api/messages/:roomId', () => HttpResponse.json(BASE_RESPONSE)),
    );
    renderPage();
    expect(
      await screen.findByRole('button', { name: 'Bob' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /your secret santa/i }),
    ).toBeInTheDocument();
  });

  it('renders outgoing and incoming bubbles for the active thread', async () => {
    server.use(
      http.get('/api/messages/:roomId', () => HttpResponse.json(BASE_RESPONSE)),
    );
    renderPage();

    await screen.findByText('Hope you like puzzles!');
    expect(screen.getByText('Thanks for the hint!')).toBeInTheDocument();
  });

  it('switches to santa thread when that tab is clicked', async () => {
    server.use(
      http.get('/api/messages/:roomId', () => HttpResponse.json(BASE_RESPONSE)),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('button', { name: /your secret santa/i });
    await user.click(
      screen.getByRole('button', { name: /your secret santa/i }),
    );

    expect(await screen.findByText('Do you like books?')).toBeInTheDocument();
    expect(
      screen.queryByText('Hope you like puzzles!'),
    ).not.toBeInTheDocument();
  });

  it('appends sent message to the giftee thread optimistically', async () => {
    server.use(
      http.get('/api/messages/:roomId', () => HttpResponse.json(BASE_RESPONSE)),
      http.post('/api/messages', () =>
        HttpResponse.json(
          {
            id: 'msg-new',
            roomId: 'room-1',
            text: 'Enjoy your gift!',
            createdAt: new Date().toISOString(),
            direction: 'out',
            thread: 'giftee',
          },
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Hope you like puzzles!');
    await user.type(
      screen.getByPlaceholderText(/write a message/i),
      'Enjoy your gift!',
    );
    await user.click(screen.getByRole('button', { name: '' })); // Send button (icon only)

    expect(await screen.findByText('Enjoy your gift!')).toBeInTheDocument();
  });

  it('shows an error toast when sending fails', async () => {
    server.use(
      http.get('/api/messages/:roomId', () => HttpResponse.json(BASE_RESPONSE)),
      http.post('/api/messages', () =>
        HttpResponse.json(
          { message: 'No assignment found for this room' },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Hope you like puzzles!');
    await user.type(screen.getByPlaceholderText(/write a message/i), 'hello');
    await user.click(screen.getByRole('button', { name: '' }));

    expect(
      await screen.findByText(/no assignment found for this room/i),
    ).toBeInTheDocument();
  });

  it('shows empty-thread placeholder when a thread has no messages', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({
          giftee: { id: 'user-2', name: 'Carol', messages: [] },
          santa: { messages: [] },
        }),
      ),
    );
    renderPage();

    await screen.findByRole('button', { name: 'Carol' });
    expect(
      await screen.findByText(/send your giftee a hint/i),
    ).toBeInTheDocument();
  });
});
