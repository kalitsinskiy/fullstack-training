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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiParam({
    name: 'user',
    description: 'The details of the user to create',
    type: CreateUserDto,
  })
  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.usersService.create(user);
  }

  @ApiOperation({ summary: 'Get the current user' })
  @ApiBearerAuth('JWT')
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findById(@CurrentUser('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user === null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiOperation({ summary: 'Update the current user' })
  @ApiBearerAuth('JWT')
  @ApiParam({
    name: 'updates',
    description: 'The fields to update for the current user',
    type: UpdateUserDto,
  })
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

  @ApiOperation({ summary: 'Delete the current user' })
  @ApiBearerAuth('JWT')
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
