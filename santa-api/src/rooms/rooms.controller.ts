import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PaginatedResponse } from '../common/pagination';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ApiRoomRoute } from './decorators/api-room-route.decorator';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { DrawRoomDto } from './dto/draw-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { PaginatedRoomsResponseDto } from './dto/paginated-rooms-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomPermissionsGuard } from './guards/room-permissions.guard';
import type { AssignmentView, Room } from './room.types';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@ApiTags('rooms')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RoomPermissionsGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiRoomRoute({
    summary: 'Create a new Secret Santa room',
    status: 201,
    description: 'Room created successfully',
    type: RoomResponseDto,
    params: [],
    badRequest: 'Validation error',
  })
  create(
    @Body() body: CreateRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.create(body, userId);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiRoomRoute({
    summary: 'Get rooms for the authenticated user',
    description: 'Paginated list of rooms',
    type: PaginatedRoomsResponseDto,
    params: [],
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponse<Room>> {
    return this.roomsService.findByUser(userId, { page, limit });
  }

  @Get(':id')
  @RequirePermissions('room:view')
  @ApiRoomRoute({
    summary: 'Get a room by id',
    description: 'Room returned successfully',
    type: RoomResponseDto,
    badRequest: 'Malformed room id',
    notFound: 'Room not found, or the caller is not a participant',
  })
  findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.findByIdForUser(id, userId);
  }

  @Post('join')
  @ApiRoomRoute({
    summary: 'Join a room using only its invite code',
    status: 201,
    description: 'Room joined successfully',
    type: RoomResponseDto,
    params: [],
    badRequest: 'Invalid or expired invite code',
  })
  joinByCode(
    @Body() body: JoinRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.joinByCode(body.inviteCode, userId);
  }

  @Post(':id/join')
  @ApiRoomRoute({
    summary: 'Join a room by id using its invite code',
    status: 201,
    description: 'Room joined successfully',
    type: RoomResponseDto,
    badRequest: 'Invalid invite code, or malformed room id',
    forbidden: 'Draw already completed',
    notFound: 'Room not found',
  })
  join(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: JoinRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.join(id, body.inviteCode, userId);
  }

  @Post(':id/draw')
  @HttpCode(200)
  @RequirePermissions('room:draw')
  @ApiRoomRoute({
    summary: 'Run the draw for a room (owner only)',
    description: 'Draw completed; room is now drawn',
    type: RoomResponseDto,
    badRequest: 'Not enough participants / already drawn / malformed room id',
    forbidden: 'Only the creator can run the draw',
    notFound: 'Room not found',
  })
  draw(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: DrawRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.draw(id, userId, body.exchangeDate);
  }

  @Get(':id/assignment')
  @ApiRoomRoute({
    summary: 'Get the giftee assigned to the current user',
    description: 'Your assignment',
    badRequest: 'Draw not completed yet, or malformed room id',
    forbidden: 'Not a room participant',
    notFound: 'Room or assignment not found',
  })
  getAssignment(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<AssignmentView> {
    return this.roomsService.getAssignment(id, userId);
  }

  @Patch(':id')
  @RequirePermissions('room:edit')
  @ApiRoomRoute({
    summary: 'Edit a room (owner only)',
    description: 'Room updated',
    type: RoomResponseDto,
    badRequest: 'Validation error, or malformed room id',
    forbidden: 'Missing room:edit permission',
    notFound: 'Room not found',
  })
  edit(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateRoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.editRoom(id, body, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('room:delete')
  @ApiRoomRoute({
    summary: 'Delete a room (owner only)',
    status: 204,
    description: 'Room deleted',
    badRequest: 'Malformed room id',
    forbidden: 'Missing room:delete permission',
    notFound: 'Room not found',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.roomsService.deleteRoom(id);
  }

  @Delete(':id/members/:userId')
  @HttpCode(204)
  @RequirePermissions('room:kick')
  @ApiRoomRoute({
    summary: 'Remove a member from a room (owner only)',
    status: 204,
    description: 'Member removed',
    params: ['id', 'userId'],
    badRequest: 'Cannot remove the owner, or malformed room/member id',
    forbidden: 'Missing room:kick permission',
    notFound: 'Room or member not found',
  })
  kick(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) targetUserId: string,
  ): Promise<void> {
    return this.roomsService.kickMember(id, targetUserId);
  }

  @Post(':id/invite-code/regenerate')
  @HttpCode(200)
  @RequirePermissions('room:invite')
  @ApiRoomRoute({
    summary: 'Regenerate the room invite code (owner only)',
    description: 'New invite code generated',
    type: RoomResponseDto,
    badRequest: 'Malformed room id',
    forbidden: 'Missing room:invite permission',
    notFound: 'Room not found',
  })
  regenerateInvite(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Room> {
    return this.roomsService.regenerateInviteCode(id, userId);
  }
}
