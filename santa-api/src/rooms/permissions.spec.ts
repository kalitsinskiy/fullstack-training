import { permissionsForRole, roleHasPermission } from './permissions';

describe('permissionsForRole', () => {
  it('grants owners the full capabilities set', () => {
    const owner = permissionsForRole('owner');

    for (const p of [
      'room:view',
      'room:draw',
      'room:invite',
      'room:kick',
      'room:edit',
      'room:delete',
      'wishlist:set',
    ] as const) {
      expect(owner).toContain(p);
    }
  });

  it('grants members exactly room:view + wishlist:set privileges', () => {
    expect([...permissionsForRole('member')].sort()).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('grants members exactly room:view + wishlist:set privileges', () => {
    expect([...permissionsForRole('member')].sort()).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('returns an empty set for an unknown role', () => {
    expect(permissionsForRole('unexisting' as never)).toEqual([]);
  });
});

describe('roleHasPermission', () => {
  it('is true for a granted permission', () => {
    expect(roleHasPermission('owner', 'room:delete')).toBe(true);
  });

  it('is false for a permission the role denies', () => {
    expect(roleHasPermission('member', 'room:delete')).toBe(false);
    expect(roleHasPermission('member', 'room:draw')).toBe(false);
  });
});
