import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { server, sampleRoom } from '@/test/msw-server';
import { RoomsDetailedPage } from './RoomDetailPage';

const BASE = 'http://localhost:3001';

function renderDetail(route = `/rooms/${sampleRoom.id}`) {
  renderApp(
    <Routes>
      <Route path="/rooms/:id" element={<RoomsDetailedPage />} />
    </Routes>,
    { route, authed: true }
  );
}

describe('RoomDetailPage', () => {
  test('renders the room name, code, status after fetch', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Office Party' })).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('owner of a pending room sees the Draw and Delete buttons', async () => {
    renderDetail();

    expect(await screen.findByRole('button', { name: /run the draw/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.queryByText(/gift exchange/i)).not.toBeInTheDocument();
  });

  test('a close room locks the wishlist editor', async () => {
    server.use(
      http.get(`${BASE}/api/rooms/:id`, () =>
        HttpResponse.json({ ...sampleRoom, status: 'closed' })
      )
    );

    renderDetail();

    expect(
      await screen.findByText(/this room is closed — wishlists are locked/i)
    ).toBeInTheDocument();
  });
});
