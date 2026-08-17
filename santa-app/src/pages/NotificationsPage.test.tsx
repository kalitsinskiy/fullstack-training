import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { NotificationsPage } from './NotificationsPage';

const TOKEN_KEY = 'santa.accessToken';

const UNREAD_NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'user.joined',
  message: 'Bob joined "Office Party"',
  roomId: 'room-1',
  read: false,
  createdAt: new Date('2024-06-01T10:00:00Z').toISOString(),
};

const READ_NOTIFICATION = {
  id: 'notif-2',
  userId: 'user-1',
  type: 'draw.completed',
  message: 'The draw for "Office Party" is done. Check who you got!',
  roomId: 'room-1',
  read: true,
  createdAt: new Date('2024-06-02T10:00:00Z').toISOString(),
};

function renderPage() {
  localStorage.setItem(TOKEN_KEY, 'fake-token');
  server.use(
    http.get('/api/users/me', () =>
      HttpResponse.json({
        id: 'user-1',
        email: 'alice@test.com',
        displayName: 'Alice',
        role: 'user',
      }),
    ),
  );
  return renderWithProviders(<NotificationsPage />);
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'fake-token');
  });

  // ---------------------------------------------------------------------------
  // Loading & empty states
  // ---------------------------------------------------------------------------
  it('shows skeleton placeholders while loading', () => {
    server.use(
      http.get('/api/notifications', () => new Promise(() => {})), // never resolves
    );
    renderPage();
    // Four skeleton divs are rendered while loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows the empty state when there are no notifications', async () => {
    renderPage();
    expect(
      await screen.findByText(/you're all caught up/i),
    ).toBeInTheDocument();
  });

  it('shows an error message when the API call fails', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
          { status: 401 },
        ),
      ),
    );
    renderPage();
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Rendering notifications
  // ---------------------------------------------------------------------------
  it('renders notification messages', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION, READ_NOTIFICATION],
          total: 2,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );
    renderPage();

    expect(
      await screen.findByText('Bob joined "Office Party"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the draw for "office party"/i),
    ).toBeInTheDocument();
  });

  it('shows a "New" badge on unread notifications only', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION, READ_NOTIFICATION],
          total: 2,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );
    renderPage();

    await screen.findByText('Bob joined "Office Party"');
    const badges = screen.getAllByText('New');
    expect(badges).toHaveLength(1);
  });

  it('shows type and formatted date as secondary text', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION],
          total: 1,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );
    renderPage();

    await screen.findByText('Bob joined "Office Party"');
    expect(screen.getByText(/user\.joined/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Mark as read
  // ---------------------------------------------------------------------------
  it('marks a notification as read when clicked', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION],
          total: 1,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
      http.patch('/api/notifications/notif-1/read', () =>
        HttpResponse.json({ ...UNREAD_NOTIFICATION, read: true }),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Bob joined "Office Party"');
    expect(screen.getByText('New')).toBeInTheDocument();

    await user.click(screen.getByText('Bob joined "Office Party"'));

    await waitFor(() => {
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  it('does not fire a PATCH when clicking an already-read notification', async () => {
    let patchCalled = false;
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [READ_NOTIFICATION],
          total: 1,
          unreadCount: 0,
          page: 1,
          limit: 20,
        }),
      ),
      http.patch('/api/notifications/notif-2/read', () => {
        patchCalled = true;
        return HttpResponse.json({ ...READ_NOTIFICATION });
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/the draw for "office party"/i);
    await user.click(screen.getByText(/the draw for "office party"/i));

    // Give any potential network call time to fire
    await new Promise((r) => setTimeout(r, 100));
    expect(patchCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Mark all as read
  // ---------------------------------------------------------------------------
  it('shows "Mark all read" button only when there are unread notifications', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION],
          total: 1,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );
    renderPage();

    expect(
      await screen.findByRole('button', { name: /mark all read/i }),
    ).toBeInTheDocument();
  });

  it('hides "Mark all read" button when unreadCount is 0', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [READ_NOTIFICATION],
          total: 1,
          unreadCount: 0,
          page: 1,
          limit: 20,
        }),
      ),
    );
    renderPage();

    await screen.findByText(/the draw for "office party"/i);
    expect(
      screen.queryByRole('button', { name: /mark all read/i }),
    ).not.toBeInTheDocument();
  });

  it('marks all notifications as read when "Mark all read" is clicked', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [
            UNREAD_NOTIFICATION,
            { ...UNREAD_NOTIFICATION, id: 'notif-3', message: 'Carol joined' },
          ],
          total: 2,
          unreadCount: 2,
          page: 1,
          limit: 20,
        }),
      ),
      http.patch('/api/notifications/read-all', () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('button', { name: /mark all read/i });
    await user.click(screen.getByRole('button', { name: /mark all read/i }));

    await waitFor(() => {
      expect(screen.queryAllByText('New')).toHaveLength(0);
    });
  });

  it('shows a success toast after marking all as read', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [UNREAD_NOTIFICATION],
          total: 1,
          unreadCount: 1,
          page: 1,
          limit: 20,
        }),
      ),
      http.patch('/api/notifications/read-all', () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /mark all read/i }),
    );

    expect(
      await screen.findByText(/all notifications marked as read/i),
    ).toBeInTheDocument();
  });
});
