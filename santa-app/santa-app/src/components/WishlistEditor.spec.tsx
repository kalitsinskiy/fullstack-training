import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderApp } from '@/test/renderApp';
import { server, API_URL, ALICE, ROOM_OFFICE, tokenFor } from '@/test/msw-server';
import { WishlistEditor } from './WishlistEditor';

function renderEditor() {
  return renderApp(<WishlistEditor roomId={ROOM_OFFICE._id} />, { token: tokenFor(ALICE.email) });
}

describe('WishlistEditor', () => {
  test('adds a new item row', async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add item/i }));

    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  test('removes an item row', async () => {
    const user = userEvent.setup();
    renderEditor();

    await screen.findByText('Item 1');
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getByText('Item 2')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[1]);

    await waitFor(() => expect(screen.queryByText('Item 2')).not.toBeInTheDocument());
  });

  test('shows a Zod validation error when the name is left empty on submit', async () => {
    const user = userEvent.setup();
    renderEditor();

    await screen.findByText('Item 1');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  test('submitting the form saves the wishlist via POST /api/rooms/:id/wishlist', async () => {
    const user = userEvent.setup();
    const received: Array<{ roomId: string; body: unknown }> = [];
    server.use(
      http.post(`${API_URL}/api/rooms/:roomId/wishlist`, async ({ request, params }) => {
        const body = await request.json();
        received.push({ roomId: String(params.roomId), body });
        return HttpResponse.json(body, { status: 201 });
      }),
    );

    renderEditor();

    await screen.findByText('Item 1');
    await user.type(screen.getAllByLabelText('Name *')[0], 'Warm socks');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({
      roomId: ROOM_OFFICE._id,
      body: { items: [{ name: 'Warm socks' }] },
    });
  });
});
