import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  paginate,
  PaginationQuery,
  PaginatedResponse,
} from '../common/pagination';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}

  create(dto: CreateRoomDto, ownerId: string) {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    return this.roomModel.create({
      name: dto.name,
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
  ): Promise<PaginatedResponse<Room>> {
    return paginate(this.roomModel, { participants: userId }, query);
  }

  findById(id: string) {
    return this.roomModel.findById(id).exec();
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
}
