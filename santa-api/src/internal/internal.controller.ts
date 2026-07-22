import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceKeyGuard } from './guards/service-key.guard';
import { UsersService } from '../users/users.service';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';

@Controller('internal')
@ApiTags('internal')
@UseGuards(ServiceKeyGuard)
export class InternalController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).lean<RoomDocument>().exec();
    if (!doc) throw new NotFoundException('Room not found');

    return {
      id: doc._id.toString(),
      name: doc.name,
      memberIds: doc.participants.map((p) => p.userId.toString()),
    };
  }

  @Get('rooms/:roomId/relations/:userId')
  async getRelations(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ): Promise<{ gifteeId: string | null; santaId: string | null }> {
    if (!Types.ObjectId.isValid(roomId))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel
      .findById(roomId)
      .lean<RoomDocument>()
      .exec();
    if (!doc) throw new NotFoundException('Room not found');

    if (doc.status !== 'drawn') {
      return { gifteeId: null, santaId: null };
    }

    const gifteeAssignment = doc.assignments.find(
      (a) => a.giverId.toString() === userId,
    );
    const santaAssignment = doc.assignments.find(
      (a) => a.receiverId.toString() === userId,
    );

    return {
      gifteeId: gifteeAssignment?.receiverId.toString() ?? null,
      santaId: santaAssignment?.giverId.toString() ?? null,
    };
  }
}
