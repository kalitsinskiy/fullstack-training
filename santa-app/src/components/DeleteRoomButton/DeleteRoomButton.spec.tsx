import { describe, test, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/msw-server';
import { DeleteRoomButton } from './DeleteRoomButton';

const BASE = 'http://localhost:3001';

describe('DeleteRoomButton', () => {
  test('confirming deletes the room (correct id) and navigates to /rooms', async () => {
    const user = userEvent.setup();
    let deletedId: string | undefined;
    server.use(
      http.delete(`${BASE}/api/rooms/:id`, ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderApp(
      <Routes>
        <Route path="/rooms/r1" element={<DeleteRoomButton roomId="r1" />} />
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Routes>,
      { route: '/rooms/r1' }
    );

    await user.click(screen.getByRole('button', { name: /delete room/i }));
    await screen.findByText('Delete this room?');
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText('Rooms screen')).toBeInTheDocument();
    await waitFor(() => expect(deletedId).toBe('r1'));
  });

  test('Cancel closes the dialog without deleting', async () => {
    const user = userEvent.setup();
    renderApp(<DeleteRoomButton roomId="r1" />, { route: '/rooms/r1' });

    await user.click(screen.getByRole('button', { name: /delete room/i }));
    await screen.findByText('Delete this room?');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByText('Delete this room?')).not.toBeInTheDocument());
  });
});
