import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import JoinRoomDto from './dto/join-room.dto';
import CreateRoomDto from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('rooms')
@ApiBearerAuth('JWT')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({
    name: 'page',
    description: 'The page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The number of items per page',
    example: 10,
  })
  @Get()
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return await this.roomsService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiQuery({
    name: 'id',
    description: 'The ID of the room',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Get(':id')
  async findById(@Param('id') id: string) {
    const room = await this.roomsService.findById(id);
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @ApiOperation({ summary: 'Create a new room' })
  @ApiParam({
    name: 'room',
    description: 'The details of the room to create',
    type: CreateRoomDto,
  })
  @Post()
  async create(@Body() room: CreateRoomDto) {
    return await this.roomsService.create(room);
  }

  @ApiOperation({ summary: 'Update a room by ID' })
  @ApiQuery({
    name: 'id',
    description: 'The ID of the room to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'updates',
    description: 'The updates to apply to the room',
    type: UpdateRoomDto,
  })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: UpdateRoomDto) {
    const room = await this.roomsService.updateById(id, updates);
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @ApiOperation({ summary: 'Delete a room by ID' })
  @ApiQuery({
    name: 'id',
    description: 'The ID of the room to delete',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.roomsService.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return { success: true };
  }

  @ApiOperation({ summary: 'Join a room by code' })
  @ApiQuery({
    name: 'code',
    description: 'The code of the room to join',
    example: 'ABCDE',
  })
  @ApiParam({
    name: 'joinDto',
    description: 'The data required to join the room',
    type: JoinRoomDto,
  })
  @Post(':code/join')
  async join(@Param('code') code: string, @Body() joinDto: JoinRoomDto) {
    const room = await this.roomsService.findByCode(code);
    if (!room) {
      throw new NotFoundException(`Room with code ${code} not found`);
    }
    return this.roomsService.addMember(code, joinDto);
  }
}
