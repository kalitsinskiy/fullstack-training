import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { ServiceKeyGuard } from './guards/service-key.guard';

@Controller('internal')
@UseGuards(ServiceKeyGuard)
export class InternalController {
  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    const room = await this.roomsService.findByIdInternal(id);
    return { id: room.id, name: room.name, memberIds: room.memberIds };
  }
}
