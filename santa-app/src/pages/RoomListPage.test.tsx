import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { RoomListPage } from './RoomListPage';

describe('RoomListPage', () => {
  it('shows empty state when no rooms', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );

    renderWithProviders(<RoomListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no rooms yet/i)).toBeInTheDocument();
    });
  });

  it('renders room cards when rooms exist', async () => {
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [
            {
              id: 'room-1',
              name: 'Holiday Gift Exchange',
              inviteCode: 'ABC',
              creatorId: 'user-1',
              status: 'pending',
              participants: [],
              participantCount: 5,
            },
            {
              id: 'room-2',
              name: 'Office Party',
              inviteCode: 'DEF',
              creatorId: 'user-2',
              status: 'drawn',
              participants: [],
              participantCount: 3,
            },
          ],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );

    renderWithProviders(<RoomListPage />);

    await waitFor(() => {
      expect(screen.getByText('Holiday Gift Exchange')).toBeInTheDocument();
    });
    expect(screen.getByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText('5 participants')).toBeInTheDocument();
    expect(screen.getByText('3 participants')).toBeInTheDocument();
  });

  it('create room form submits and room appears', async () => {
    let createCalled = false;
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: createCalled
            ? [{ id: 'room-new', name: 'My New Room', inviteCode: 'XYZ', creatorId: 'user-1', status: 'pending', participants: [], participantCount: 1 }]
            : [],
          meta: { total: createCalled ? 1 : 0, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
      http.post('/api/rooms', () => {
        createCalled = true;
        return HttpResponse.json(
          { id: 'room-new', name: 'My New Room', inviteCode: 'XYZ', creatorId: 'user-1', status: 'pending', participants: [], participantCount: 1 },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RoomListPage />);

    // Wait for initial load (empty state)
    await waitFor(() => {
      expect(screen.getByText(/no rooms yet/i)).toBeInTheDocument();
    });

    // Click "New room" to show form
    await user.click(screen.getByRole('button', { name: /new room/i }));

    // Fill in and submit
    await user.type(screen.getByLabelText(/room name/i), 'My New Room');
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    // Room should now appear
    await waitFor(() => {
      expect(screen.getByText('My New Room')).toBeInTheDocument();
    });
  });
});
