import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PaginatedResponse } from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { PaginatedRoomsResponseDto } from './dto/paginated-rooms-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import type { Room } from './room.types';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@ApiTags('rooms')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Secret Santa room' })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() body: CreateRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.create(body, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get rooms for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of rooms',
    type: PaginatedRoomsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponse<Room>> {
    return this.roomsService.findByUser(userId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiParam({
    name: 'id',
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({
    status: 200,
    description: 'Room returned successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findById(@Param('id') id: string): Promise<Room> {
    return this.roomsService.findById(id);
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Join a room by invite code' })
  @ApiParam({
    name: 'code',
    description: 'Invite code for the room',
    example: 'Q7X4LM',
  })
  @ApiResponse({
    status: 201,
    description: 'Room joined successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room with code not found' })
  joinByCode(
    @Param('code') code: string,
    @Body() _body: JoinRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.joinByCode(code, userId);
  }
}
