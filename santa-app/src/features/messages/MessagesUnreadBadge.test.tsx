import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { MessagesUnreadBadge } from './MessagesUnreadBadge';

describe('MessagesUnreadBadge', () => {
  it('shows the total when there are unread messages', async () => {
    renderWithProviders(<MessagesUnreadBadge />);

    expect(
      await screen.findByLabelText('3 unread messages'),
    ).toBeInTheDocument();
  });

  it('renders nothing when there are none', async () => {
    server.use(
      http.get('/api/messages/unread', () =>
        HttpResponse.json({ total: 0, rooms: [] }),
      ),
    );
    const { container } = renderWithProviders(<MessagesUnreadBadge />);
    await waitFor(() => expect(container.querySelector('span')).toBeNull());
  });
});
