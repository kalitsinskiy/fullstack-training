import {
  Controller,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RoomsService, type Room } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

interface JoinRoomInput {
  userId: string;
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() input: CreateRoomDto): Room {
    return this.roomsService.create(input);
  }

  @Get()
  findAll(): Room[] {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Room {
    const room = this.roomsService.findById(id);

    if (!room) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    return room;
  }

  @Post(':code/join')
  @HttpCode(HttpStatus.OK)
  join(@Param('code') code: string, @Body() input: JoinRoomDto): Room {
    const room = this.roomsService.addMember(code, input.userId);

    if (!room) {
      throw new NotFoundException(`Room with code ${code} not found`);
    }

    return room;
  }
}
