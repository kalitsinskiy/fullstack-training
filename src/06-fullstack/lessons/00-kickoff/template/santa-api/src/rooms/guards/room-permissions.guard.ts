import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { Permission } from '../permissions';
import { Room as RoomModel } from '../schemas/room.schema';

/**
 * Enforces `@RequirePermissions(...)` on room routes.
 *
 * Runs AFTER `JwtAuthGuard`, so `request.user` is already populated.
 *
 * TODO (Lesson 04): implement `canActivate`:
 *   1. Read the required permissions from metadata (REQUIRE_PERMISSIONS_KEY) for
 *      the current handler via `this.reflector`. If none are required, return
 *      true (this guard is a no-op on unannotated routes).
 *   2. Read the caller id (`request.user.id`) and the room id from route params.
 *      NOTE: most routes use `:id`, but the wishlist routes use `:roomId` —
 *      read whichever is present.
 *   3. Load the room and find the caller's participant entry.
 *        - not a participant  -> throw `NotFoundException` (do not leak existence)
 *   4. Resolve the participant's role to its permission set with
 *      `permissionsForRole(role)` and require EVERY requested permission to be
 *      present.
 *        - missing a permission -> throw `ForbiddenException`
 *   5. Decide by PERMISSION, never by the role string.
 */
@Injectable()
export class RoomPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  canActivate(_context: ExecutionContext): Promise<boolean> | boolean {
    // Remove this throw and implement per the TODO above.
    void this.reflector;
    void this.roomModel;
    void REQUIRE_PERMISSIONS_KEY;
    const _required: Permission[] = [];
    void _required;
    throw new NotImplementedException(
      'RoomPermissionsGuard.canActivate is not implemented (Lesson 04)',
    );
  }
}
