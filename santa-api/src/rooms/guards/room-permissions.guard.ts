import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Permission, permissionsForRole } from '../permissions';
import { Room as RoomModel } from '../schemas/room.schema';

/**
 * Enforces `@RequirePermissions(...)` on room routes. Runs AFTER `JwtAuthGuard`,
 * so `request.user` is already populated. Decides by PERMISSION, never by role.
 */
@Injectable()
export class RoomPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    // No permission declared on this route → nothing to enforce.
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id?: string };
      params?: { id?: string; roomId?: string };
    }>();
    const userId: string | undefined = request.user?.id;
    // Most routes use :id; the wishlist routes use :roomId.
    const roomId: string | undefined =
      request.params?.id ?? request.params?.roomId;

    if (!userId || !roomId || !isValidObjectId(roomId)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const membership = room.participants.find(
      (p) => p.userId.toString() === userId,
    );
    // Not a participant — 404 (don't leak that the room exists).
    if (!membership) {
      throw new NotFoundException('Room not found');
    }

    const granted = permissionsForRole(membership.role);
    const hasAll = required.every((perm) => granted.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient room permissions');
    }
    return true;
  }
}
