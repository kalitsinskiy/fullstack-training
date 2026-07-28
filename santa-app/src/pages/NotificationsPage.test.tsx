import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { NotificationsPage } from './NotificationsPage';

describe('NotificationsPage', () => {
  it('renders the notification list from the API', async () => {
    renderWithProviders(<NotificationsPage />, { route: '/notifications' });

    expect(await screen.findByText('Bob joined "Office Party"')).toBeInTheDocument();
    expect(
      screen.getByText('The draw for "Office Party" is complete!'),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });

  it('links each notification to its room via roomId', async () => {
    renderWithProviders(<NotificationsPage />, { route: '/notifications' });

    const links = await screen.findAllByRole('link', { name: /view room/i });
    expect(links[0]).toHaveAttribute('href', '/rooms/r1');
  });

  it('marks an unread notification read on click (PATCHes it)', async () => {
    let patched = '';

    server.use(
      http.patch('/api/notifications/:id/read', ({ params }) => {
        patched = String(params.id);
        return HttpResponse.json({
          id: params.id,
          userId: 'u1',
          type: 'user.joined',
          message: 'Bob joined "Office Party"',
          read: true,
          createdAt: new Date().toISOString(),
        });
      }),
    );

    renderWithProviders(<NotificationsPage />, { route: '/notifications' });

    await userEvent.click(await screen.findByText('Bob joined "Office Party"'));
    await waitFor(() => expect(patched).toBe('n1'));
  });

  it('shows the empty state when there are no notifications', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [],
          total: 0,
          unreadCount: 0,
          page: 1,
          limit: 20,
        }),
      ),
    );

    renderWithProviders(<NotificationsPage />, { route: '/notifications' });

    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });
});
