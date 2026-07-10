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
});
