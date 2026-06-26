import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiExcludeController } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { UsersService } from '../users/users.service';
import { Room as RoomModel } from '../rooms/schemas/room.schema';

/**
 * Internal, service-to-service endpoints (X-Service-Key only, no user JWT).
 * santa-notifications calls these to enrich notifications with user/room data.
 */
@Controller('internal')
@ApiExcludeController()
@UseGuards(ServiceKeyGuard)
export class InternalController {
  constructor(
    private readonly users: UsersService,
    @InjectModel(RoomModel.name) private readonly roomModel: Model<RoomModel>,
  ) {}

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.users.findById(id); // 404 if missing/invalid
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return {
      id: room._id.toString(),
      name: room.name,
      memberIds: room.participants.map((p) => p.userId.toString()),
    };
  }

  /**
   * A user's two messaging relationships in a room: who they give to (giftee)
   * and who gives to them (their Secret Santa). santa-notifications uses this to
   * route messages and build the two threads. The santaId stays server-side —
   * notifications must never leak it back to the giftee.
   */
  @Get('rooms/:roomId/relations/:userId')
  async getRelations(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room || room.status !== 'drawn') {
      return { gifteeId: null, santaId: null };
    }
    const giftee = room.assignments.find(
      (a) => a.giverId.toString() === userId,
    );
    const santa = room.assignments.find(
      (a) => a.receiverId.toString() === userId,
    );
    return {
      gifteeId: giftee ? giftee.receiverId.toString() : null,
      santaId: santa ? santa.giverId.toString() : null,
    };
  }
}
