import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { Permission } from '../permissions';
import { permissionsForRole } from '../permissions';
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

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user: { id: string };
      params: Record<string, string>;
    }>();

    const callerId = request.user.id;
    const roomId = request.params.id ?? request.params.roomId;

    if (!roomId || !Types.ObjectId.isValid(roomId)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel
      .findOne({
        _id: new Types.ObjectId(roomId),
        'participants.userId': new Types.ObjectId(callerId),
      })
      .exec();

    if (!room) throw new NotFoundException('Room not found');

    const participant = room.participants.find(
      (p) => p.userId.toString() === callerId,
    );

    if (!participant) throw new NotFoundException('Participant not found');

    const granted = permissionsForRole(participant.role);
    const hasAll = required.every((p) => granted.includes(p));

    if (!hasAll) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
