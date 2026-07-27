import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { InternalRelationsResponseDto } from './dto/internal-relations-response.dto';
import { InternalRoomResponseDto } from './dto/internal-room-response.dto';
import { InternalUserResponseDto } from './dto/internal-user-response.dto';

@Controller('internal')
@ApiExcludeController()
@UseGuards(ServiceKeyGuard)
@SkipThrottle()
export class InternalController {
  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get('users/:id')
  async findUser(@Param('id') id: string): Promise<InternalUserResponseDto> {
    const user = await this.usersService.findById(id);
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  @Get('rooms/:id')
  findRoom(@Param('id') id: string): Promise<InternalRoomResponseDto> {
    return this.roomsService.findInternalById(id);
  }

  @Get('rooms/:roomId/relations/:userId')
  findRelations(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ): Promise<InternalRelationsResponseDto> {
    return this.roomsService.findRelations(roomId, userId);
  }
}
