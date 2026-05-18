import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import UpdateWishlistDto from './dto/update-wishlist.dto';
import { RoomsService } from 'src/rooms/rooms.service';
import { UsersService } from 'src/users/users.service';

@Controller('/rooms/:roomCode/wishlist')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

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
    return this.wishlistService.set(room._id, user._id, items);
  }

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
    return this.wishlistService.get(room._id, user._id);
  }
}
