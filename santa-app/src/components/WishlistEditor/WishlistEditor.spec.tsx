import { describe, test, expect } from 'vitest';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/msw-server';
import { WishlistEditor } from './WishlistEditor';

const BASE = 'http://localhost:3001';

async function awaitReady() {
  await screen.findByText(/loading wishlist/i);
  await waitForElementToBeRemoved(() => screen.queryByText(/loading wishlist/i));
}

describe('WishlistEditor', () => {
  test('starts with one empty item row (404 wishlist -> empty)', async () => {
    renderApp(<WishlistEditor roomId="r1" />, { authed: true });
    await awaitReady();

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  test('"+Add item" - appends a row', async () => {
    const user = userEvent.setup();
    renderApp(<WishlistEditor roomId="r1" />, { authed: true });
    await awaitReady();

    screen.getByText('Item 1');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  test('"Remove" - deletes a row', async () => {
    const user = userEvent.setup();
    renderApp(<WishlistEditor roomId="r1" />, { authed: true });
    await awaitReady();

    screen.getByText('Item 1');
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getByText('Item 2')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() => expect(screen.queryByText('Item 2')).not.toBeInTheDocument());
  });

  test('shows per-row Zod errors on invalid input', async () => {
    const user = userEvent.setup();
    renderApp(<WishlistEditor roomId="r1" />, { authed: true });
    await awaitReady();

    screen.getByLabelText('Name');
    await user.type(screen.getByLabelText('URL (optional)'), 'not-a-url');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
  });

  test('"Save" - sends the items to POST /api/rooms/:id/wishlist', async () => {
    const user = userEvent.setup();
    let posted: { items: { name: string }[] } | undefined;

    server.use(
      http.get(`${BASE}/api/rooms/:roomId/wishlist/:userId`, () =>
        HttpResponse.json({ roomId: 'r1', userId: 'u1', items: [{ name: 'Pair of socks' }] })
      ),
      http.post(`${BASE}/api/rooms/:roomId/wishlist`, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json({ roomId: 'r1', userId: 'u1', items: posted!.items });
      })
    );

    renderApp(<WishlistEditor roomId="r1" />, { authed: true });
    await awaitReady();

    screen.getByDisplayValue('Pair of socks');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(posted?.items?.[0]?.name).toBe('Pair of socks'));
  });

  test('when the room is closed, the editor is locked', async () => {
    renderApp(<WishlistEditor roomId="r1" disabled />, { authed: true });
    await awaitReady();

    expect(screen.getByText(/this room is closed — wishlists are locked/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});
