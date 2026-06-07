import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@ApiTags('rooms')
@ApiBearerAuth('JWT')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created' })
  create(@Body() dto: CreateRoomDto, @CurrentUser('id') userId: string) {
    return this.roomsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List rooms for the current user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of rooms' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roomsService.findByUser(userId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 403, description: 'Not a member of this room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const room = await this.roomsService.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    const isMember =
      room.creatorId.toString() === userId ||
      room.participants.some((p) => p.toString() === userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return room;
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Join a room by invite code' })
  @ApiParam({ name: 'code', description: '6-character invite code' })
  @ApiResponse({ status: 201, description: 'Joined room successfully' })
  @ApiResponse({ status: 403, description: 'Room is already drawn' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  join(@Param('code') code: string, @CurrentUser('id') userId: string) {
    return this.roomsService.join(code, userId);
  }

  @Post(':id/draw')
  @ApiOperation({
    summary: 'Run the Secret Santa draw for a room (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Room MongoDB ID' })
  @ApiResponse({ status: 201, description: 'Draw completed' })
  @ApiResponse({
    status: 400,
    description: 'Room already drawn or fewer than 3 participants',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the room owner can run the draw',
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  draw(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomsService.draw(id, userId);
  }
}
