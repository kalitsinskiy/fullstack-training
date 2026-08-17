export type RoomRole = 'owner' | 'member';

export type Permission =
  | 'room:view'
  | 'room:draw'
  | 'room:invite'
  | 'room:kick'
  | 'room:edit'
  | 'room:delete'
  | 'wishlist:set';

/**
 * The ONLY place a role maps to permissions.
 *
 * Authorization everywhere else asks "is permission X present?" — it never
 * branches on the role string. Roles are just named presets of permissions.
 *
 * To add a new role, add ONE entry here (and to the `RoomRole` union). Nothing
 * else — guard, routes, decorators, frontend — needs to change.
 */
export const ROLE_PERMISSIONS: Record<RoomRole, readonly Permission[]> = {
  owner: [
    'room:view',
    'room:draw',
    'room:invite',
    'room:kick',
    'room:edit',
    'room:delete',
    'wishlist:set',
  ],
  member: ['room:view', 'wishlist:set'],
};

/** Resolve a role to its permission set. The single source of role → permissions. */
export function permissionsForRole(role: RoomRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** True if the role's preset grants the given permission. */
export function roleHasPermission(
  role: RoomRole,
  permission: Permission,
): boolean {
  return permissionsForRole(role).includes(permission);
}
