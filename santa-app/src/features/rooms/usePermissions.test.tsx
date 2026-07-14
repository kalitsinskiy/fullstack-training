import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import { usePermissions } from './usePermissions';
import type { Permission, RoomDetail } from '@/types/api';

/**
 * COMPONENT/HOOK TESTS (Vitest + RTL + MSW) for permission gating — Lesson 04.
 *

 */

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

function makeRoom(viewerPermissions: Permission[]): RoomDetail {
  return {
    id: '123',
    name: 'Office Party',
    inviteCode: 'ABC123',
    creatorId: 'u1',
    status: 'pending',
    participants: [
      { id: 'u1', displayName: 'Alice', role: 'owner' },
      { id: 'u2', displayName: 'Bob', role: 'member' },
      { id: 'u3', displayName: 'Carol', role: 'member' },
    ],
    participantCount: 3,
    viewerPermissions,
  };
}

/** Serve GET /api/rooms/123 with the given viewer permissions. */
function useRoomHandler(viewerPermissions: Permission[]) {
  server.use(
    http.get('/api/rooms/123', () =>
      HttpResponse.json(makeRoom(viewerPermissions)),
    ),
  );
}

function renderRoom() {
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>,
    { route: '/rooms/123' },
  );
}

describe('usePermissions', () => {
  it('can() returns true for permissions present in room.viewerPermissions', () => {
    const { can } = usePermissions(makeRoom(OWNER_PERMISSIONS));
    expect(can('room:draw')).toBe(true);
    expect(can('room:kick')).toBe(true);
  });

  it('can() returns false for absent permissions, and for a null room', () => {
    const member = usePermissions(makeRoom(MEMBER_PERMISSIONS));
    expect(member.can('room:draw')).toBe(false);
    expect(member.can('room:delete')).toBe(false);

    const noRoom = usePermissions(null);
    expect(noRoom.can('room:view')).toBe(false);
  });
});

describe('room permission gating (UI)', () => {
  it('as owner: Draw / Kick / Delete / regenerate controls render and are enabled', async () => {
    useRoomHandler(OWNER_PERMISSIONS);
    renderRoom();

    // Wait for the room to load (its title appears in the header).
    await screen.findByRole('heading', { name: 'Office Party' });

    const draw = screen.getByRole('button', { name: /draw names/i });
    expect(draw).toBeEnabled(); // 3 participants → not disabled

    expect(screen.getByRole('button', { name: /delete room/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /new/i })).toBeEnabled();
    // One kick button per non-owner member (Bob, Carol).
    expect(screen.getAllByRole('button', { name: /kick/i })).toHaveLength(2);
  });

  it('as member: owner-only controls are hidden', async () => {
    useRoomHandler(MEMBER_PERMISSIONS);
    renderRoom();

    await screen.findByRole('heading', { name: 'Office Party' });

    // The member can still see the room + their wishlist…
    expect(
      screen.getByRole('button', { name: /save wishlist/i }),
    ).toBeInTheDocument();

    // …but every owner-only control is absent (nothing to click, so nothing to
    // fire — the strongest "guarded handler" guarantee at the UI layer).
    expect(
      screen.queryByRole('button', { name: /draw names/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete room/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /kick/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^new$/i }),
    ).not.toBeInTheDocument();
  });
});
