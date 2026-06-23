import type { Permission, RoomDetail } from '@/types/api';

/**
 * Returns a `can(permission)` predicate for the current room, backed by
 * `room.viewerPermissions` (the caller's effective permissions, sent by the API).
 *
 * Gate UI on PERMISSIONS, never on a role string — hide or disable controls and
 * guard their handlers with `can(...)`.
 *
 * TODO (Lesson 04): return `{ can }` where `can(p)` is true iff
 * `room.viewerPermissions` includes `p`. When `room` is null/undefined (not yet
 * loaded), every permission is denied.
 *
 * @example
 *   const { can } = usePermissions(room);
 *   {can('room:draw') && <Button onClick={runDraw}>Draw</Button>}
 */
export function usePermissions(
  room: Pick<RoomDetail, 'viewerPermissions'> | null | undefined,
): { can: (permission: Permission) => boolean } {
  // TODO: derive from room?.viewerPermissions. Replace this deny-all stub.
  void room;
  return { can: () => false };
}
