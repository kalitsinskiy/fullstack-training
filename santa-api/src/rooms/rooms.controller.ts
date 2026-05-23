import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import JoinRoomDto from './dto/join-room.dto';
import CreateRoomDto from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: UpdateRoomDto) {
    const room = await this.roomsService.updateById(id, updates);
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.roomsService.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return { success: true };
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
