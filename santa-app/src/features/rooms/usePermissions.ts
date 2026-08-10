import type { Permission, RoomDetail } from '@/types/api';

/**
 * Returns a `can(permission)` predicate for the current room, backed by
 * `room.viewerPermissions`. Denies all permissions when room is null/undefined.
 *
 * @example
 *   const { can } = usePermissions(room);
 *   {can('room:draw') && <Button onClick={runDraw}>Draw</Button>}
 */
export function usePermissions(
  room: Pick<RoomDetail, 'viewerPermissions'> | null | undefined,
): { can: (permission: Permission) => boolean } {
  return {
    can: (permission: Permission) =>
      room?.viewerPermissions?.includes(permission) ?? false,
  };
}
