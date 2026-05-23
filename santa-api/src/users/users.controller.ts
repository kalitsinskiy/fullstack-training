import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.usersService.create(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findById(@CurrentUser('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user === null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser('id') id: string,
    @Body() updates: UpdateUserDto,
  ) {
    const user = await this.usersService.updateById(id, updates);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@CurrentUser('id') id: string) {
    const deleted = await this.usersService.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }
}
