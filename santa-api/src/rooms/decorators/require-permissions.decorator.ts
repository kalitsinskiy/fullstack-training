import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const REQUIRE_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declare the permissions a route requires. `RoomPermissionsGuard` reads this
 * metadata and enforces it. Gate on permissions, never on roles.
 *
 * @example
 *   @RequirePermissions('room:draw')
 *   @Post(':id/draw')
 *   draw() { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
