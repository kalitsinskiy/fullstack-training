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
