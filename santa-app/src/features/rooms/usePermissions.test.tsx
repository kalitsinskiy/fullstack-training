import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/render';
import { usePermissions } from './usePermissions';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import type { Permission, RoomDetail } from '@/types/api';

const TOKEN_KEY = 'santa.accessToken';

const BASE_ROOM: RoomDetail = {
  id: 'room-1',
  name: 'Test Room',
  inviteCode: 'ABC123',
  creatorId: 'user-1',
  status: 'pending',
  participants: [
    { id: 'user-1', displayName: 'Alice', role: 'owner' },
    { id: 'user-2', displayName: 'Bob', role: 'member' },
    { id: 'user-3', displayName: 'Carol', role: 'member' },
  ],
  participantCount: 3,
};

describe('usePermissions', () => {
  it('can() returns true for permissions present in room.viewerPermissions', () => {
    const room = {
      viewerPermissions: [
        'room:view',
        'room:draw',
        'wishlist:set',
      ] as Permission[],
    };

    const { can } = usePermissions(room);

    expect(can('room:draw')).toBe(true);
    expect(can('room:view')).toBe(true);
    expect(can('wishlist:set')).toBe(true);
  });

  it('can() returns false for absent permissions', () => {
    const room = {
      viewerPermissions: ['room:view', 'wishlist:set'] as Permission[],
    };

    const { can } = usePermissions(room);

    expect(can('room:draw')).toBe(false);
    expect(can('room:kick')).toBe(false);
    expect(can('room:edit')).toBe(false);
    expect(can('room:delete')).toBe(false);
  });

  it('can() returns false for a null room', () => {
    const { can } = usePermissions(null);

    expect(can('room:draw')).toBe(false);
    expect(can('room:view')).toBe(false);
    expect(can('wishlist:set')).toBe(false);
  });

  it('can() returns false for an undefined room', () => {
    const { can } = usePermissions(undefined);

    expect(can('room:draw')).toBe(false);
    expect(can('room:view')).toBe(false);
  });

  it('can() returns false when viewerPermissions is undefined', () => {
    const room = { viewerPermissions: undefined };

    const { can } = usePermissions(room);

    expect(can('room:draw')).toBe(false);
  });
});

describe('room permission gating (UI)', () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
  });

  function renderAsOwner() {
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
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({
          ...BASE_ROOM,
          viewerPermissions: [
            'room:view',
            'room:draw',
            'room:invite',
            'room:kick',
            'room:edit',
            'room:delete',
            'wishlist:set',
          ],
        }),
      ),
      http.get('/api/rooms/:id/wishlist/:userId', () =>
        HttpResponse.json({ userId: 'user-1', roomId: 'room-1', items: [] }),
      ),
    );
    return renderWithProviders(
      <Routes>
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
      </Routes>,
      { route: '/rooms/room-1' },
    );
  }

  function renderAsMember() {
    localStorage.setItem(TOKEN_KEY, 'fake-token');
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({
          id: 'user-2',
          email: 'bob@test.com',
          displayName: 'Bob',
          role: 'user',
        }),
      ),
      http.get('/api/rooms/:id', () =>
        HttpResponse.json({
          ...BASE_ROOM,
          viewerPermissions: ['room:view', 'wishlist:set'],
        }),
      ),
      http.get('/api/rooms/:id/wishlist/:userId', () =>
        HttpResponse.json({ userId: 'user-2', roomId: 'room-1', items: [] }),
      ),
    );
    return renderWithProviders(
      <Routes>
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
      </Routes>,
      { route: '/rooms/room-1' },
    );
  }

  it('as owner: Draw names button is rendered for pending room with 3+ participants', async () => {
    renderAsOwner();
    expect(
      await screen.findByRole('button', { name: /draw names/i }),
    ).toBeInTheDocument();
  });

  it('as owner: Kick button is rendered for other participants', async () => {
    renderAsOwner();
    await screen.findByText('Test Room');
    const kickButtons = await screen.findAllByRole('button', { name: /kick/i });
    expect(kickButtons.length).toBeGreaterThan(0);
  });

  it('as owner: Delete room button is rendered', async () => {
    renderAsOwner();
    await screen.findByText('Test Room');
    expect(
      await screen.findByRole('button', { name: /delete room/i }),
    ).toBeInTheDocument();
  });

  it('as member: Draw names button is not rendered', async () => {
    renderAsMember();
    await screen.findByText('Test Room');
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /draw names/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('as member: Kick button is not rendered', async () => {
    renderAsMember();
    await screen.findByText('Test Room');
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /kick/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('as member: Delete room button is not rendered', async () => {
    renderAsMember();
    await screen.findByText('Test Room');
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /delete room/i }),
      ).not.toBeInTheDocument();
    });
  });
});
