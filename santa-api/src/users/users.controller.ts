import {
  Controller,
  Body,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService, type User } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() input: CreateUserDto): User {
    return this.usersService.create(input);
  }

  @Get(':id')
  findOne(@Param('id') id: string): User {
    const user = this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }
}
