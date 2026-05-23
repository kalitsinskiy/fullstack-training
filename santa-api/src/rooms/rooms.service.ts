import { Injectable } from '@nestjs/common';
import CreateRoomDto from './dto/create-room.dto';
import JoinRoomDto from './dto/join-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RoomsRepository } from './repositories/rooms.repository';

@Injectable()
export class RoomsService {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  create(room: CreateRoomDto): Promise<RoomResponseDto> {
    return this.roomsRepository.create(room);
  }

  findAll(): Promise<RoomResponseDto[]> {
    return this.roomsRepository.findAll();
  }

  findById(id: string): Promise<RoomResponseDto | null> {
    return this.roomsRepository.findById(id);
  }

  findByCode(code: string): Promise<RoomResponseDto | null> {
    return this.roomsRepository.findByCode(code);
  }

  addMember(
    code: string,
    joinData: JoinRoomDto,
  ): Promise<RoomResponseDto | null> {
    return this.roomsRepository.addMember(code, joinData);
  }

  updateById(
    id: string,
    updates: Partial<Pick<CreateRoomDto, 'name'>>,
  ): Promise<RoomResponseDto | null> {
    return this.roomsRepository.updateById(id, updates);
  }

  deleteById(id: string): Promise<boolean> {
    return this.roomsRepository.deleteById(id);
  }
}
