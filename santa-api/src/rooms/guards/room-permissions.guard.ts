import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { permissionsForRole, type Permission } from '../permissions';
import { Room as RoomModel } from '../schemas/room.schema';

/**
 * Enforces `@RequirePermissions(...)` on room routes.
 *
 * Runs AFTER `JwtAuthGuard`, so `request.user` is already populated.
 *
 * SKELETON: this stub ALLOWS every request so the routes you build in earlier
 * lessons keep working. Implementing real enforcement is your Lesson 04 task —
 * until then, membership/ownership checks live in the services.
 *
 * TODO (Lesson 04): replace `return true` with real enforcement:
 *   1. Read the required permissions from metadata (REQUIRE_PERMISSIONS_KEY) for
 *      the current handler via `this.reflector`. If none are required, return true.
 *   2. Read the caller id (`request.user.id`) and the room id from route params
 *      (`:id`, or `:roomId` on the wishlist routes — read whichever is present).
 *   3. Load the room and find the caller's participant entry.
 *        - not a participant  -> throw `NotFoundException` (do not leak existence)
 *   4. Resolve the participant's role to its permission set with
 *      `permissionsForRole(role)` and require EVERY requested permission.
 *        - missing a permission -> throw `ForbiddenException`
 *   5. Decide by PERMISSION, never by the role string.
 */
@Injectable()
export class RoomPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO (Lesson 04): enforce required permissions (see the steps above).
    // Until then, allow everything so the lessons 00-03 routes keep working.
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      params: Record<string, string>;
    }>();

    const userId = request.user?.id;
    const roomId = request.params.id ?? request.params.roomId;

    if (!userId || !roomId || !Types.ObjectId.isValid(roomId)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel
      .findById(roomId)
      .select('participants')
      .lean()
      .exec();
    const participant = room?.participants.find(
      (p) => p.userId.toString() === userId,
    );

    if (!participant) {
      throw new NotFoundException('Room not found');
    }

    const granted = permissionsForRole(participant.role);
    const hasAll = required.every((perm) => granted.includes(perm));

    if (!hasAll) {
      throw new ForbiddenException('You do not have permission to do that');
    }

    return true;
  }
}
