import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ServiceKeyGuard } from './service-key.guard';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import type { RoomRelations } from '../rooms/room.types';

@ApiExcludeController()
@Controller('internal')
@UseGuards(ServiceKeyGuard)
@SkipThrottle()
export class InternalController {
  constructor(
    private readonly userService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get('users/:id')
  async getUser(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ id: string; displayName: string; email: string }> {
    const user = await this.userService.findById(id);

    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
    };
  }

  @Get('rooms/:id')
  getRoom(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ id: string; name: string; memberIds: string[] }> {
    return this.roomsService.getParticipantIds(id);
  }

  @Get('rooms/:roomId/relations/:userId')
  getRelations(
    @Param('roomId', ParseObjectIdPipe) roomId: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
  ): Promise<RoomRelations> {
    return this.roomsService.getRelations(roomId, userId);
  }
}
