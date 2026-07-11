import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { tokenStore } from '@/lib/api';
import { RoomDetailPage } from './RoomDetailPage';

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: '/rooms/r1' },
  );
}

beforeEach(() => tokenStore.set('test-token'));

describe('RoomDetailPage', () => {
  it('renders room name, invite code, status and participants', async () => {
    setup();

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('shows a not-found state when the room 404s', async () => {
    server.use(
      http.get('/api/rooms/:id', () => new HttpResponse(null, { status: 404 })),
    );

    setup();

    expect(await screen.findByText(/room not found/i)).toBeInTheDocument();
  });

  it('hides "Draw names" for a non-creator', async () => {
    server.use(
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({
          id: 'r1',
          name: 'Office Party',
          inviteCode: 'ABC123',
          creatorId: 'someone-else',
          status: 'pending',
          participantCount: 3,
          participants: [{ id: 'u1', displayName: 'Alice', role: 'member' }],
        }),
      ),
    );

    setup();

    await screen.findByText('Office Party');

    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument();
  });

  it('disables "Draw names" with fewer than 3 participants', async () => {
    server.use(
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({
          id: 'r1',
          name: 'Office Party',
          inviteCode: 'ABC123',
          creatorId: 'u1',
          status: 'pending',
          participantCount: 2,
          participants: [{ id: 'u1', displayName: 'Alice', role: 'owner' }],
        }),
      ),
    );

    setup();

    expect(
      await screen.findByRole('button', { name: /draw names/i }),
    ).toBeDisabled();
  });

  it('reveals the exchange date and your giftee once drawn', async () => {
    server.use(
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({
          id: 'r1',
          name: 'Office Party',
          inviteCode: 'ABC123',
          creatorId: 'u1',
          status: 'drawn',
          exchangeDate: '2026-12-24',
          participantCount: 3,
          participants: [{ id: 'u1', displayName: 'Alice', role: 'owner' }],
        }),
      ),
      http.get('/api/rooms/:id/assignment', () =>
        HttpResponse.json({
          receiver: { id: 'u2', displayName: 'Bob', wishlist: ['Wool socks'] },
        }),
      ),
    );

    setup();

    expect(await screen.findByText(/you're gifting:/i)).toHaveTextContent(
      'Bob',
    );
    expect(screen.getByText('Wool socks')).toBeInTheDocument();
    expect(screen.getByText(/gift exchange on/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument(); // hidden when drawn
  });
});
