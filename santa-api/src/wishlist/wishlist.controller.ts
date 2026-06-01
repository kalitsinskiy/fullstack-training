import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WishlistService } from './wishlist.service';
import UpdateWishlistDto from './dto/update-wishlist.dto';
import { UpdateWishlistItemsDto } from './dto/update-wishlist-items.dto';
import { RoomsService } from 'src/rooms/rooms.service';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('wishlist')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('/rooms/:roomCode/wishlist')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Set or replace the wishlist for a user in a room' })
  @ApiParam({
    name: 'roomCode',
    required: true,
    description: 'The code of the room',
  })
  @ApiParam({
    name: 'wishlist',
    description: 'The wishlist data including userId and items',
    type: UpdateWishlistDto,
  })
  @Post()
  async setWishlist(
    @Param('roomCode') roomCode: string,
    @Body() wishlist: UpdateWishlistDto,
  ) {
    const { userId, items } = wishlist;
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.wishlistService.set(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
      items,
    );
  }

  @ApiOperation({ summary: 'Update the wishlist items for a user in a room' })
  @ApiParam({
    name: 'roomCode',
    required: true,
    description: 'The code of the room',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
  })
  @ApiParam({
    name: 'updates',
    description: 'The list of wishlist items to update',
    type: UpdateWishlistItemsDto,
  })
  @Patch('/:userId')
  async updateWishlist(
    @Param('roomCode') roomCode: string,
    @Param('userId') userId: string,
    @Body() updates: UpdateWishlistItemsDto,
  ) {
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.wishlistService.set(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
      updates.items,
    );
  }

  @ApiOperation({ summary: 'Delete the wishlist for a user in a room' })
  @ApiParam({
    name: 'roomCode',
    required: true,
    description: 'The code of the room',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
  })
  @Delete('/:userId')
  async removeWishlist(
    @Param('roomCode') roomCode: string,
    @Param('userId') userId: string,
  ) {
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const deleted = await this.wishlistService.delete(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
    );
    if (!deleted) {
      throw new NotFoundException(
        `Wishlist for user ${userId} in room ${roomCode} not found`,
      );
    }
    return { success: true };
  }
  @ApiOperation({ summary: 'Get the wishlist for a user in a room' })
  @ApiParam({
    name: 'roomCode',
    required: true,
    description: 'The code of the room',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
  })
  @Get('/:userId')
  async getWishlist(
    @Param('roomCode') roomCode: string,
    @Param('userId') userId: string,
  ) {
    const room = await this.roomsService.findByCode(roomCode);
    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.wishlistService.get(
      new Types.ObjectId(room._id),
      new Types.ObjectId(user._id),
    );
  }
}
