import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { usePermissions } from './usePermissions';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { tokenStore } from '@/lib/api';

/**
 * COMPONENT/HOOK TESTS (Vitest + RTL + MSW) for permission gating — Lesson 04.
 *
 * Gate UI on PERMISSIONS, never on the role. Drive the two cases by what the API
 * returns in `room.viewerPermissions` (stub it via MSW handlers in test/mocks):
 *   - owner  → viewerPermissions includes room:draw / room:kick / room:edit / room:delete
 *   - member → viewerPermissions is ['room:view', 'wishlist:set']
 *
 * Turn each todo into a real test as you implement usePermissions + the gating.
 */
const OWNER_PERMS = [
  'room:view',
  'room:draw',
  'room:invite',
  'room:kick',
  'room:edit',
  'room:delete',
  'wishlist:set',
];
const MEMBER_PERMS = ['room:view', 'wishlist:set'];

function recordOwnerOnlyRequests(): string[] {
  const calls: string[] = [];
  const record = (label: string) => () => {
    calls.push(label);

    return new HttpResponse(null, { status: 204 });
  };

  server.use(
    http.post('/api/rooms/:id/draw', record('draw')),
    http.patch('/api/rooms/:id', record('edit')),
    http.delete('/api/rooms/:id', record('delete')),
    http.delete('/api/rooms/:id/members/:userId', record('kick')),
    http.post('/api/rooms/:id/invite-code/regenerate', record('regenerate')),
  );

  return calls;
}

function setupRoom(viewerPermissions: string[], participantCount = 3) {
  server.use(
    http.get('/api/rooms/:id', () =>
      HttpResponse.json({
        id: 'r1',
        name: 'Office Party',
        inviteCode: 'ABC123',
        creatorId: 'u1',
        status: 'pending',
        participantCount,
        participants: [
          {
            id: 'u1',
            displayName: 'Alice',
            role: viewerPermissions.includes('room:edit') ? 'owner' : 'member',
          },
          { id: 'u2', displayName: 'Bob', role: 'member' },
        ],
        viewerPermissions,
      }),
    ),
    http.get('/api/rooms/:roomId/wishlist/:userId', () =>
      HttpResponse.json({ roomId: 'r1', userId: 'u1', items: [] }),
    ),
  );

  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: '/rooms/r1' },
  );
}

describe('usePermissions', () => {
  it('can() returns true for permissions present in room.viewerPermissions', () => {
    const { can } = usePermissions({
      viewerPermissions: ['room:draw', 'room:edit'],
    });

    expect(can('room:draw')).toBe(true);
    expect(can('room:edit')).toBe(true);
  });

  it('can() returns false for absent permissions, and for a null room', () => {
    expect(
      usePermissions({ viewerPermissions: ['room:view'] }).can('room:delete'),
    ).toBe(false);
    expect(usePermissions(null).can('room:draw')).toBe(false);
    expect(usePermissions(undefined).can('room:view')).toBe(false);
  });
});

describe('room permission gating (UI)', () => {
  beforeEach(() => tokenStore.set('test-token'));

  it('as owner: Draw / Kick / Edit / Delete controls render and are enabled', async () => {
    setupRoom(OWNER_PERMS);

    await screen.findByText('Office Party');
    expect(
      screen.getByRole('button', { name: /draw names/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove bob/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /regenerate invite code/i }),
    ).toBeInTheDocument();
  });

  it('as member: owner-only controls are hidden, and none of their endpoints are called', async () => {
    const calls = recordOwnerOnlyRequests();

    setupRoom(MEMBER_PERMS);

    await screen.findByText('Office Party');
    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /edit/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /remove/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /regenerate/i }),
    ).not.toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it('clicking a guarded owner-only control fires no request', async () => {
    const calls = recordOwnerOnlyRequests();
    const user = userEvent.setup();

    setupRoom(OWNER_PERMS, 2);

    const draw = await screen.findByRole('button', { name: /draw names/i });

    expect(draw).toBeDisabled();

    await user.click(draw);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(calls).toEqual([]);

    await user.click(screen.getByRole('button', { name: /remove bob/i }));

    await waitFor(() => expect(calls).toEqual(['kick']));
  });
});
