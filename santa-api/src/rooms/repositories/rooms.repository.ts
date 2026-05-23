import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from '../schemas/room.schema';
import { RoomResponseDto } from '../dto/room-response.dto';
import CreateRoomDto from '../dto/create-room.dto';
import JoinRoomDto from '../dto/join-room.dto';

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}

  async create(room: CreateRoomDto): Promise<RoomResponseDto> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const doc = await this.roomModel.create({
      name: room.name,
      creatorId: room.ownerId,
      inviteCode: code,
      participants: [room.ownerId],
    });
    return new RoomResponseDto(doc as any);
  }

  async findAll(): Promise<RoomResponseDto[]> {
    const docs = await this.roomModel.find().exec();
    return docs.map((doc) => new RoomResponseDto(doc as any));
  }

  async findById(id: string): Promise<RoomResponseDto | null> {
    const doc = await this.roomModel.findById(id).exec();
    return doc ? new RoomResponseDto(doc as any) : null;
  }

  async findByCode(code: string): Promise<RoomResponseDto | null> {
    const doc = await this.roomModel.findOne({ inviteCode: code }).exec();
    return doc ? new RoomResponseDto(doc as any) : null;
  }

  async addMember(
    code: string,
    joinData: JoinRoomDto,
  ): Promise<RoomResponseDto | null> {
    const { userId } = joinData;
    const doc = await this.roomModel
      .findOneAndUpdate(
        { inviteCode: code },
        {
          $addToSet: { participants: userId },
        },
        { new: true },
      )
      .exec();
    return doc ? new RoomResponseDto(doc as any) : null;
  }

  async updateById(
    id: string,
    updates: Partial<Pick<CreateRoomDto, 'name'>>,
  ): Promise<RoomResponseDto | null> {
    const doc = await this.roomModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    return doc ? new RoomResponseDto(doc as any) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.roomModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
