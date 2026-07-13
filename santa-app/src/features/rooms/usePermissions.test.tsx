import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import type { RoomDetail } from '@/types/api';

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
describe('usePermissions', () => {
  it('can() returns true for permissions present in room.viewerPermissions', () => {
    const room = {
      viewerPermissions: [
        'room:view',
        'room:draw',
        'room:kick',
        'room:edit',
        'room:delete',
      ],
    } as Pick<RoomDetail, 'viewerPermissions'>;

    const { result } = renderHook(() => usePermissions(room));

    expect(result.current.can('room:draw')).toBe(true);
    expect(result.current.can('room:kick')).toBe(true);
    expect(result.current.can('room:delete')).toBe(true);
  });

  it('can() returns false for absent permissions, and for a null room', () => {
    const ownerRoom = {
      viewerPermissions: ['room:view', 'room:draw'],
    } as Pick<RoomDetail, 'viewerPermissions'>;

    const memberRoom = {
      viewerPermissions: ['room:view', 'wishlist:set'],
    } as Pick<RoomDetail, 'viewerPermissions'>;

    const { result: ownerResult } = renderHook(() =>
      usePermissions(ownerRoom),
    );
    const { result: memberResult } = renderHook(() =>
      usePermissions(memberRoom),
    );
    const { result: nullResult } = renderHook(() => usePermissions(null));

    expect(ownerResult.current.can('room:delete')).toBe(false);
    expect(memberResult.current.can('room:kick')).toBe(false);
    expect(nullResult.current.can('room:view')).toBe(false);
  });
});
