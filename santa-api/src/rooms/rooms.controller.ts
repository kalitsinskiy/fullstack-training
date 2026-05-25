import {
  Body,
  Controller,
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
  @ApiResponse({ status: 404, description: 'Room not found' })
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Join a room by invite code' })
  @ApiParam({ name: 'code', description: '6-character invite code' })
  @ApiResponse({ status: 201, description: 'Joined room successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async join(@Param('code') code: string, @CurrentUser('id') userId: string) {
    const room = await this.roomsService.addMember(code, userId);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
}
