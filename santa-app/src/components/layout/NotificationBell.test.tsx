import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { NotificationBell } from './NotificationBell';

function serveUnreadCount(unreadCount: number) {
  server.use(
    http.get('/api/notifications', () =>
      HttpResponse.json({ data: [], unreadCount }),
    ),
  );
}

describe('NotificationBell', () => {
  it('shows the unread count from the notifications endpoint', async () => {
    serveUnreadCount(6);
    renderWithProviders(<NotificationBell />);

    expect(
      await screen.findByRole('button', { name: 'Notifications, 6 unread' }),
    ).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('shows no badge when everything is read', async () => {
    serveUnreadCount(0);
    renderWithProviders(<NotificationBell />);

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  it('caps the badge at 99+', async () => {
    serveUnreadCount(150);
    renderWithProviders(<NotificationBell />);

    expect(await screen.findByText('99+')).toBeInTheDocument();
  });
});
