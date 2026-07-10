import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { WishlistEditor } from './WishlistEditor';

describe('WishlistEditor', () => {
  it('starts with one blank row when the wishlist is empty', async () => {
    renderWithProviders(<WishlistEditor roomId="r1" userId="u1" />);

    const inputs = await screen.findAllByPlaceholderText(/gift item/i);

    expect(inputs).toHaveLength(1);
  });

  it('adds/edits items and saves them as a string[]', async () => {
    let putBody: { items: string[] } | undefined;

    server.use(
      http.put('/api/rooms/:roomId/wishlist', async ({ request }) => {
        putBody = (await request.json()) as { items: string[] };

        return HttpResponse.json({
          roomId: 'r1',
          userId: 'u1',
          items: putBody.items,
        });
      }),
    );

    renderWithProviders(<WishlistEditor roomId="r1" userId="u1" />);

    await userEvent.type(
      await screen.findByPlaceholderText(/gift item 1/i),
      'Lego car',
    );
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    await userEvent.type(
      await screen.findByPlaceholderText(/gift item 2/i),
      'A pair of socks',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save wishlist/i }),
    );

    await vi.waitFor(() =>
      expect(putBody).toEqual({ items: ['Lego car', 'A pair of socks'] }),
    );
  });
});
