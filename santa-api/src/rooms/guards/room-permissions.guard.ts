import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AuthenticatedUser } from '../../auth/jwt.strategy';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { permissionsForRole, type Permission } from '../permissions';
import { Room as RoomModel } from '../schemas/room.schema';

/**
 * Enforces `@RequirePermissions(...)` on room routes.
 *
 * Runs AFTER `JwtAuthGuard`, so `request.user` is already populated.
 *
 */
@Injectable()
export class RoomPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndMerge<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: { id?: string; roomId?: string };
    }>();
    const userId = request.user?.id;
    const roomId = request.params.id ?? request.params.roomId;

    if (!userId || !roomId) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(roomId).exec();
    const participant = room?.participants.find(
      (p) => p.userId.toString() === userId,
    );
    if (!room || !participant) {
      throw new NotFoundException('Room not found');
    }

    const granted = permissionsForRole(participant.role);
    const missing = required.filter((perm) => !granted.includes(perm));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing required permission(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
