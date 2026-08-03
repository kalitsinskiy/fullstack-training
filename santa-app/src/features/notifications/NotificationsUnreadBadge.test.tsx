import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { NotificationsUnreadBadge } from './NotificationsUnreadBadge';

describe('UnreadBadge', () => {
  it('shows the unread count when > 0', async () => {
    renderWithProviders(<NotificationsUnreadBadge />);

    expect(
      await screen.findByLabelText(/1 unread notifications/i),
    ).toBeInTheDocument();
  });

  it('renders nothing when the count is 0', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [],
          total: 0,
          unreadCount: 0,
          page: 1,
          limit: 1,
        }),
      ),
    );

    const { container } = renderWithProviders(<NotificationsUnreadBadge />);

    await waitFor(() => expect(container.querySelector('span')).toBeNull());
  });
});
