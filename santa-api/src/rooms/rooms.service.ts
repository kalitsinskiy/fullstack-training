import { Injectable } from '@nestjs/common';
import { CreateRoomDto, Room } from './models/room';

@Injectable()
export class RoomsService {
  private readonly rooms: Map<string, Room> = new Map();

  create(room: CreateRoomDto): Room {
    const id = crypto.randomUUID();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const newRoom: Room = {
      id,
      name: room.name,
      ownerId: room.ownerId,
      code,
      members: [room.ownerId],
      createdAt: new Date(),
    };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  findAll(): Array<Room> {
    return Array.from(this.rooms.values());
  }

  findById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  findByCode(code: string): Room | undefined {
    return Array.from(this.rooms.values()).find((room) => room.code === code);
  }

  addMember(code: string, userId: string): Room | undefined {
    const room = this.findByCode(code);
    if (!room) return undefined;
    if (!room.members.includes(userId)) {
      room.members.push(userId);
    }
    return room;
  }
}
