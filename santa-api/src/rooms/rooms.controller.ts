import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import JoinRoomDto from './dto/join-room.dto';
import CreateRoomDto from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async findAll() {
    return await this.roomsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const room = await this.roomsService.findById(id);
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @Post()
  async create(@Body() room: CreateRoomDto) {
    return await this.roomsService.create(room);
  }

  @Post(':code/join')
  async join(@Param('code') code: string, @Body() joinDto: JoinRoomDto) {
    const room = await this.roomsService.findByCode(code);
    if (!room) {
      throw new NotFoundException(`Room with code ${code} not found`);
    }
    return this.roomsService.addMember(code, joinDto);
  }
}
