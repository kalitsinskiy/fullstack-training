import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ServiceKeyGuard } from './service-key.guard';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';

@ApiExcludeController()
@Controller('internal')
@UseGuards(ServiceKeyGuard)
export class InternalController {
  constructor(
    private readonly userService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get('users/:id')
  async getUser(
    @Param('id') id: string,
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
    @Param('id') id: string,
  ): Promise<{ id: string; name: string; memberIds: string[] }> {
    return this.roomsService.getParticipantIds(id);
  }
}
