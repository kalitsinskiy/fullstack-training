import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomListPage } from './RoomListPage';
import type { Paginated, RoomSummary } from '@/types/api';

function room(overrides: Partial<RoomSummary> = {}): RoomSummary {
  return {
    id: '665f0c2ab7d13a5e8b1c4d9f',
    name: 'Office Secret Santa',
    status: 'pending',
    participantCount: 3,
    ...overrides,
  };
}

function page(rooms: RoomSummary[], meta: Partial<Paginated<RoomSummary>['meta']> = {}) {
  return {
    data: rooms,
    meta: {
      total: rooms.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      ...meta,
    },
  };
}

function serveRooms(rooms: RoomSummary[]) {
  server.use(http.get('/api/rooms', () => HttpResponse.json(page(rooms))));
}

describe('RoomListPage', () => {
  it('shows a loading message while the rooms are in flight', async () => {
    serveRooms([room()]);
    renderWithProviders(<RoomListPage />);

    expect(screen.getByText('Loading your rooms…')).toBeInTheDocument();

    // …and it goes away once the query resolves.
    await waitFor(() => {
      expect(screen.queryByText('Loading your rooms…')).not.toBeInTheDocument();
    });
  });

  it('renders a card per room once the API resolves', async () => {
    serveRooms([
      room({ name: 'Office Secret Santa' }),
      room({
        id: '665f0c2ab7d13a5e8b1c4da0',
        name: 'Family Gift Exchange',
        status: 'drawn',
        participantCount: 1,
      }),
    ]);
    renderWithProviders(<RoomListPage />);

    expect(await screen.findByText('Office Secret Santa')).toBeInTheDocument();
    expect(screen.getByText('Family Gift Exchange')).toBeInTheDocument();

    // Status badge and the singular/plural participant count come from RoomCard.
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Drawn')).toBeInTheDocument();
    expect(screen.getByText(/3 participants/)).toBeInTheDocument();
    expect(screen.getByText(/1 participant$/)).toBeInTheDocument();

    // Each card links to its room.
    expect(screen.getAllByRole('link', { name: 'Open' })[0]).toHaveAttribute(
      'href',
      '/rooms/665f0c2ab7d13a5e8b1c4d9f',
    );
  });

  it('shows the empty state when the user has no rooms', async () => {
    serveRooms([]);
    renderWithProviders(<RoomListPage />);

    expect(await screen.findByText('No rooms yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create a room/i }),
    ).toBeInTheDocument();
  });

  it('surfaces a load failure and can retry', async () => {
    let attempt = 0;
    server.use(
      http.get('/api/rooms', () => {
        attempt += 1;
        return attempt === 1
          ? HttpResponse.json({ message: 'Could not load your rooms' }, { status: 500 })
          : HttpResponse.json(page([room({ name: 'Office Secret Santa' })]));
      }),
    );
    renderWithProviders(<RoomListPage />);

    expect(
      await screen.findByText('Could not load your rooms'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Office Secret Santa')).toBeInTheDocument();
    expect(
      screen.queryByText('Could not load your rooms'),
    ).not.toBeInTheDocument();
  });

  it('creates a room through the dialog and refreshes the list', async () => {
    let created = false;
    const posted = vi.fn();
    server.use(
      http.get('/api/rooms', () =>
        HttpResponse.json(
          page(created ? [room({ name: 'New Year team building' })] : []),
        ),
      ),
      http.post('/api/rooms', async ({ request }) => {
        posted(await request.json());
        created = true;
        return HttpResponse.json(
          {
            id: '665f0c2ab7d13a5e8b1c4d9f',
            name: 'New Year team building',
            inviteCode: 'Q7X4LM',
            creatorId: 'u1',
            status: 'pending',
            participants: [],
            participantCount: 1,
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<RoomListPage />);

    await userEvent.click(await screen.findByRole('button', { name: /new room/i }));
    await userEvent.type(
      screen.getByLabelText('Room name'),
      'New Year team building',
    );
    await userEvent.type(screen.getByLabelText(/budget/i), '500');
    await userEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({
        name: 'New Year team building',
        budget: 500,
        currency: '$',
      });
    });

    // The dialog closed and the invalidated list now shows the new room.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      await screen.findByText('New Year team building'),
    ).toBeInTheDocument();
  });

  it('joins a room with an invite code', async () => {
    const posted = vi.fn();
    server.use(
      http.get('/api/rooms', () => HttpResponse.json(page([]))),
      http.post('/api/rooms/join', async ({ request }) => {
        posted(await request.json());
        return HttpResponse.json({
          id: '665f0c2ab7d13a5e8b1c4d9f',
          name: 'Office Secret Santa',
          inviteCode: 'Q7X4LM',
          creatorId: 'u1',
          status: 'pending',
          participants: [],
          participantCount: 2,
        });
      }),
    );

    renderWithProviders(<RoomListPage />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: /join with code/i }))[0],
    );
    // The input upper-cases as you type, so lowercase input still sends Q7X4LM.
    await userEvent.type(screen.getByLabelText('Invite code'), 'q7x4lm');
    await userEvent.click(screen.getByRole('button', { name: /^join room$/i }));

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({ inviteCode: 'Q7X4LM' });
    });
  });
});
