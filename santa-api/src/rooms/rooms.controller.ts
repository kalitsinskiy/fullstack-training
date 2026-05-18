import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() dto: CreateRoomDto, @CurrentUser('id') userId: string) {
    return this.roomsService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  @Post(':code/join')
  async join(@Param('code') code: string, @CurrentUser('id') userId: string) {
    const room = await this.roomsService.addMember(code, userId);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
}
