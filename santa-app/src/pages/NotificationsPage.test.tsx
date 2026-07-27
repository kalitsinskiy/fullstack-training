import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { NotificationsPage } from './NotificationsPage';
import type { Notification } from '@/types/api';

function eventNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    userId: null,
    roomId: '665f0c2ab7d13a5e8b1c4d9f',
    type: 'room.created',
    message: 'Room "Office Party" was created',
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function serveNotifications(notifications: Notification[]) {
  server.use(
    http.get('/api/notifications', () => HttpResponse.json(notifications)),
  );
}

describe('NotificationsPage', () => {
  it('shows the empty state when there are no notifications', async () => {
    serveNotifications([]);
    renderWithProviders(<NotificationsPage />);

    expect(
      await screen.findByText("You're all caught up"),
    ).toBeInTheDocument();
  });

  it('renders event notifications from the consumer', async () => {
    serveNotifications([
      eventNotification(),
      eventNotification({
        id: 'n2',
        type: 'user.joined',
        message: 'Alice joined the room',
      }),
    ]);
    renderWithProviders(<NotificationsPage />);

    expect(
      await screen.findByText('Room "Office Party" was created'),
    ).toBeInTheDocument();
    expect(screen.getByText('Alice joined the room')).toBeInTheDocument();
    expect(screen.getByText('2 unread.')).toBeInTheDocument();
  });

  it('marks a notification read', async () => {
    let marked = false;
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json([eventNotification({ read: marked })]),
      ),
      http.patch('/api/notifications/n1/read', () => {
        marked = true;
        return HttpResponse.json(eventNotification({ read: true }));
      }),
    );

    renderWithProviders(<NotificationsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Mark read' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Mark read' }),
      ).not.toBeInTheDocument();
    });
  });

  it('surfaces a load failure', async () => {
    server.use(
      http.get('/api/notifications', () => new HttpResponse(null, { status: 500 })),
    );
    renderWithProviders(<NotificationsPage />);

    expect(
      await screen.findByText('Could not load notifications'),
    ).toBeInTheDocument();
  });
});
