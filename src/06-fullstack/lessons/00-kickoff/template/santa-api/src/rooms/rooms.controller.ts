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
import type { AssignmentView, Room } from './room.types';
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
  findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.findByIdForUser(id, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a room by id using its invite code' })
  @ApiParam({
    name: 'id',
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({
    status: 201,
    description: 'Room joined successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid invite code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  join(
    @Param('id') id: string,
    @Body() body: JoinRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.join(id, body.inviteCode, userId);
  }

  @Post(':id/draw')
  @ApiOperation({ summary: 'Run the draw for a room (creator only)' })
  @ApiParam({
    name: 'id',
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({
    status: 201,
    description: 'Draw completed; room is now drawn',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Not enough participants / already drawn',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only the creator can run the draw',
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  draw(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.draw(id, userId);
  }

  @Get(':id/assignment')
  @ApiOperation({ summary: 'Get the giftee assigned to the current user' })
  @ApiParam({
    name: 'id',
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({ status: 200, description: 'Your assignment' })
  @ApiResponse({ status: 400, description: 'Draw not completed yet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room or assignment not found' })
  getAssignment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<AssignmentView> {
    return this.roomsService.getAssignment(id, userId);
  }
}
