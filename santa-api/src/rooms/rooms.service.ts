import { Injectable } from '@nestjs/common';
import CreateRoomDto from './dto/create-room.dto';
import JoinRoomDto from './dto/join-room.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}

  create(room: CreateRoomDto) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    return this.roomModel.create({
      name: room.name,
      creatorId: room.ownerId,
      inviteCode: code,
      participants: [room.ownerId],
    });
  }

  findAll() {
    return this.roomModel.find().exec();
  }

  findById(id: string) {
    return this.roomModel.findById(id).exec();
  }

  findByCode(code: string) {
    return this.roomModel.findOne({ inviteCode: code }).exec();
  }

  addMember(code: string, joinData: JoinRoomDto) {
    const { userId } = joinData;

    return this.roomModel
      .findOneAndUpdate(
        { inviteCode: code },
        {
          $addToSet: { participants: userId },
        },
        { new: true },
      )
      .exec();
  }
}
