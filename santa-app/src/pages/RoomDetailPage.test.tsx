import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomDetailPage } from './RoomDetailPage';
import type { Assignment, Permission, RoomDetail } from '@/types/api';

const ROOM_ID = '665f0c2ab7d13a5e8b1c4d9f';

const OWNER_PERMISSIONS: Permission[] = [
  'room:view',
  'room:draw',
  'room:invite',
  'room:kick',
  'room:edit',
  'room:delete',
  'wishlist:set',
];
const MEMBER_PERMISSIONS: Permission[] = ['room:view', 'wishlist:set'];

function makeRoom(overrides: Partial<RoomDetail> = {}): RoomDetail {
  return {
    id: ROOM_ID,
    name: 'Office Secret Santa',
    inviteCode: 'Q7X4LM',
    creatorId: 'u1',
    status: 'pending',
    participants: [
      { id: 'u1', displayName: 'Alice', role: 'owner' },
      { id: 'u2', displayName: 'Bob', role: 'member' },
      { id: 'u3', displayName: 'Carol', role: 'member' },
    ],
    participantCount: 3,
    viewerPermissions: OWNER_PERMISSIONS,
    ...overrides,
  };
}

function serveRoom(room: RoomDetail, assignment?: Assignment) {
  server.use(
    http.get(`/api/rooms/${ROOM_ID}`, () => HttpResponse.json(room)),
    http.get(`/api/rooms/${ROOM_ID}/assignment`, () =>
      assignment
        ? HttpResponse.json(assignment)
        : HttpResponse.json(
            { message: 'The draw has not run yet' },
            { status: 400 },
          ),
    ),
  );
}

function renderRoom() {
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: `/rooms/${ROOM_ID}` },
  );
}

describe('RoomDetailPage', () => {
  it('shows the room name, status, participants and invite code', async () => {
    serveRoom(makeRoom({ budget: 500, currency: '₴' }));
    renderRoom();

    expect(
      await screen.findByRole('heading', { name: 'Office Secret Santa' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Status: pending · 3 participants'),
    ).toBeInTheDocument();

    // Every participant is listed with their role.
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getAllByText('member')).toHaveLength(2);

    expect(screen.getByText('Q7X4LM')).toBeInTheDocument();
    expect(
      screen.getByText('Gift budget: ₴500 per person'),
    ).toBeInTheDocument();
  });

  it('shows "Room not found" when the caller is not a participant', async () => {
    server.use(
      http.get(`/api/rooms/${ROOM_ID}`, () =>
        HttpResponse.json({ message: 'Room not found' }, { status: 404 }),
      ),
    );
    renderRoom();

    expect(
      await screen.findByRole('heading', { name: 'Room not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This room doesn't exist or you're not a participant."),
    ).toBeInTheDocument();
  });

  it('offers the draw to the owner, and hides it from a member', async () => {
    serveRoom(makeRoom());
    const { unmount } = renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });
    expect(screen.getByRole('button', { name: /draw names/i })).toBeEnabled();

    unmount();

    serveRoom(makeRoom({ viewerPermissions: MEMBER_PERMISSIONS }));
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });
    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument();
  });

  it('disables the draw below three participants', async () => {
    serveRoom(
      makeRoom({
        participants: [{ id: 'u1', displayName: 'Alice', role: 'owner' }],
        participantCount: 1,
      }),
    );
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });

    const draw = screen.getByRole('button', { name: /draw names/i });
    expect(draw).toBeDisabled();
    expect(draw).toHaveAttribute('title', 'Need at least 3 participants');
    expect(
      screen.getByText('Status: pending · 1 participant'),
    ).toBeInTheDocument();
  });

  it('keeps the giftee hidden until the draw has run', async () => {
    serveRoom(makeRoom());
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });

    expect(screen.getByText('Revealed after the draw.')).toBeInTheDocument();
    expect(screen.queryByText(/You're gifting/)).not.toBeInTheDocument();
  });

  it('reveals the giftee and their wishlist once the room is drawn', async () => {
    serveRoom(makeRoom({ status: 'drawn', exchangeDate: '2026-12-24' }), {
      receiver: {
        id: 'u2',
        displayName: 'Bob',
        wishlist: ['Socks', 'A good book'],
      },
    });
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });

    // Bob is both a participant and the giftee, so assert on the giftee line
    // itself rather than on a bare "Bob" match.
    expect(await screen.findByText(/You're gifting/)).toHaveTextContent(
      "You're gifting Bob",
    );
    expect(screen.getByText('Socks')).toBeInTheDocument();
    expect(screen.getByText('A good book')).toBeInTheDocument();

    // The draw is over, so the button is gone and the exchange date is shown.
    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument();
    // Formatted the same way the component does, so the assertion is TZ-proof.
    expect(
      screen.getByText(format(new Date('2026-12-24'), 'EEEE, d MMM yyyy')),
    ).toBeInTheDocument();

    // And the anonymous chat is reachable from here.
    expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute(
      'href',
      `/rooms/${ROOM_ID}/messages`,
    );
  });

  it('runs the draw and flips the room to drawn', async () => {
    const drawn = makeRoom({ status: 'drawn', exchangeDate: '2026-12-24' });
    const posted = vi.fn();
    server.use(
      http.get(`/api/rooms/${ROOM_ID}`, () => HttpResponse.json(makeRoom())),
      http.post(`/api/rooms/${ROOM_ID}/draw`, async ({ request }) => {
        posted(await request.json());
        return HttpResponse.json(drawn);
      }),
      http.get(`/api/rooms/${ROOM_ID}/assignment`, () =>
        HttpResponse.json({
          receiver: { id: 'u2', displayName: 'Bob', wishlist: [] },
        }),
      ),
    );
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Secret Santa' });
    await userEvent.click(screen.getByRole('button', { name: /draw names/i }));

    // Pick a day in the calendar. Each gridcell wraps a day button; past days
    // are disabled by `disabled={{ before: new Date() }}`, so take the first
    // enabled one — that keeps the test independent of today's date.
    const dialog = await screen.findByRole('dialog');
    const pickableDay = within(dialog)
      .getAllByRole('gridcell')
      .map((cell) => cell.querySelector('button'))
      .find(
        (button): button is HTMLButtonElement => !!button && !button.disabled,
      );
    await userEvent.click(pickableDay!);

    await userEvent.click(
      within(dialog).getByRole('button', { name: /^draw names$/i }),
    );

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({
        exchangeDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });

    // setQueryData from useDrawRoom flips the cached room, revealing the giftee.
    expect(await screen.findByText(/You're gifting/)).toHaveTextContent(
      "You're gifting Bob",
    );
  });
});
