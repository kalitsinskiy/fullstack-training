import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    const room = this.roomsService.findById(id);
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @Post()
  create(@Body() room: { name: string; ownerId: string }) {
    return this.roomsService.create(room);
  }

  @Post(':code/join')
  join(@Param('code') code: string, @Body() body: { userId: string }) {
    const room = this.roomsService.findByCode(code);
    if (!room) {
      throw new NotFoundException(`Room with code ${code} not found`);
    }
    return this.roomsService.addMember(code, body.userId);
  }
}
