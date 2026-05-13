import {
  Controller,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { UpdateWishlistDto } from './dto/update-wishlist,dto';
import { WishlistService, type Wishlist } from './wishlist.service';

@Controller('rooms/:roomId/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  upsert(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateWishlistDto,
  ): Wishlist {
    return this.wishlistService.set(roomId, dto.userId, dto.items);
  }

  @Get(':userId')
  findOne(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Wishlist {
    const wishlist = this.wishlistService.get(roomId, userId);

    if (!wishlist) {
      throw new NotFoundException(
        `Wishlist for user ${userId} in room ${roomId} not found`,
      );
    }

    return wishlist;
  }
}
