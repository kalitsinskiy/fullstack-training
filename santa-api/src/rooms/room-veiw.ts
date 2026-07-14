import { permissionsForRole } from './permissions';
import type { Room } from './room.types';

export function withViewerPermissions(room: Room, userId: string): Room {
  const mine = room.participants.find((p) => p.id === userId);

  if (!mine) return room;

  return { ...room, viewerPermissions: [...permissionsForRole(mine.role)] };
}
