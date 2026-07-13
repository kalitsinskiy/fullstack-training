import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { server, API_URL, ALICE, BOB, ROOM_OFFICE, ROOMS, tokenFor } from '@/test/msw-server';
import { RoomDetailPage } from './RoomDetailPage';

function renderRoomDetail(roomId: string, token?: string) {
  return renderApp(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: `/rooms/${roomId}`, token },
  );
}

describe('RoomDetailPage', () => {
  test('fetches the room by id and renders its name and participant count', async () => {
    renderRoomDetail(ROOM_OFFICE._id, tokenFor(ALICE.email));

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText(ROOM_OFFICE.inviteCode)).toBeInTheDocument();
    expect(screen.getByText(/3 participants/i)).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  test('shows the 404 page for a room that does not exist', async () => {
    renderRoomDetail('missing-room', tokenFor(ALICE.email));

    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  test('only the room owner sees the Trigger Draw button', async () => {
    renderRoomDetail(ROOM_OFFICE._id, tokenFor(BOB.email));

    await screen.findByText('Office Party');
    expect(screen.queryByRole('button', { name: /trigger draw/i })).not.toBeInTheDocument();
  });

  test('triggering the draw refreshes the assignment via cache invalidation', async () => {
    // Draw success invalidates the ['rooms'] prefix, which also refetches
    // this room's own detail query — so the room-by-id handler must reflect
    // the post-draw state too, not just the draw/assignment endpoints.
    let drawn = false;
    server.use(
      http.get(`${API_URL}/api/rooms/:id`, ({ params }) => {
        const room = ROOMS.find((r) => r._id === params.id);
        if (!room) return HttpResponse.json({ message: 'Room not found' }, { status: 404 });
        return HttpResponse.json({ ...room, status: drawn ? 'drawn' : room.status });
      }),
      http.get(`${API_URL}/api/rooms/:id/assignment`, () => {
        if (!drawn) return HttpResponse.json({ message: 'Draw has not been run yet' }, { status: 404 });
        return HttpResponse.json({ assigneeId: BOB.id, assigneeName: BOB.displayName });
      }),
      http.get(`${API_URL}/api/rooms/:id/assignment/wishlist`, () => {
        if (!drawn) return HttpResponse.json({ message: 'Draw has not been run yet' }, { status: 404 });
        return HttpResponse.json({
          assigneeName: BOB.displayName,
          items: [{ name: 'Warm socks', priority: 2 }],
        });
      }),
      http.post(`${API_URL}/api/rooms/:id/draw`, ({ params }) => {
        drawn = true;
        const room = ROOMS.find((r) => r._id === params.id)!;
        return HttpResponse.json({ ...room, status: 'drawn' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderRoomDetail(ROOM_OFFICE._id, tokenFor(ALICE.email));

    await screen.findByText('Office Party');
    expect(await screen.findByText(/awaiting draw/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /trigger draw/i }));

    expect(await screen.findByText(/you are buying a gift for/i)).toBeInTheDocument();
    expect(screen.getByText(BOB.displayName)).toBeInTheDocument();
    expect(screen.getByText('Drawn')).toBeInTheDocument();

    expect(await screen.findByText('Warm socks')).toBeInTheDocument();
    expect(screen.getByText(`${BOB.displayName}'s wishlist`)).toBeInTheDocument();
  });
});
