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
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Room as RoomModel } from '../schemas/room.schema';
import { permissionsForRole } from '../permissions';
import type { Permission } from '../permissions';

/** Enforces `@RequirePermissions(...)` on room routes. Runs AFTER `JwtAuthGuard`. */
@Injectable()
export class RoomPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      params: { id?: string; roomId?: string };
    }>();
    const userId = request.user?.id;
    const roomId = request.params.id ?? request.params.roomId;

    if (!userId || !roomId) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const participant = room.participants.find(
      (p) => p.userId.toString() === userId,
    );

    if (!participant) {
      throw new NotFoundException('Room not found');
    }

    const userPermissions = permissionsForRole(participant.role);

    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        throw new ForbiddenException(`Missing permission: ${permission}`);
      }
    }

    return true;
  }
}
