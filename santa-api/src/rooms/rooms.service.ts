import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import {
  paginate,
  PaginationQuery,
  PaginatedResponse,
} from '../common/pagination';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}

  create({ name, ownerId }: { name: string; ownerId: string }) {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    return this.roomModel.create({
      name,
      creatorId: ownerId,
      inviteCode,
      participants: [ownerId],
    });
  }

  findAll() {
    return this.roomModel.find().exec();
  }

  findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<RoomDocument>> {
    return paginate<RoomDocument>(
      this.roomModel as any,
      { participants: userId },
      query,
    );
  }

  async findById(id: string) {
    const room = await this.roomModel.findById(id).exec();
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  findByCode(code: string) {
    return this.roomModel.findOne({ inviteCode: code }).exec();
  }

  addMember(code: string, userId: string) {
    return this.roomModel
      .findOneAndUpdate(
        { inviteCode: code },
        { $addToSet: { participants: userId } },
        { new: true },
      )
      .exec();
  }

  async join(roomId: string, userId: string): Promise<RoomDocument> {
    const room = await this.findById(roomId);
    if (room.status === 'drawn') {
      throw new ForbiddenException(
        'Cannot join a room that has already been drawn',
      );
    }
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        { $addToSet: { participants: userId } },
        { new: true },
      )
      .exec() as Promise<RoomDocument>;
  }

  async draw(roomId: string): Promise<RoomDocument> {
    const room = await this.findById(roomId);
    if (room.participants.length < 3) {
      throw new BadRequestException(
        'At least 3 participants are required to draw',
      );
    }
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        { status: 'drawn', drawDate: new Date() },
        { new: true },
      )
      .exec() as Promise<RoomDocument>;
  }
}
