import { describe, it, expect } from 'vitest';
import { usePermissions } from './usePermissions';
import type { Permission } from '@/types/api';

describe('usePermissions', () => {
  it('can() returns true for permissions present in room.viewerPermissions', () => {
    const room = {
      viewerPermissions: ['room:view', 'room:draw', 'wishlist:set'] as Permission[],
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
