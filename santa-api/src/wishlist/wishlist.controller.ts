import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Controller('rooms/:roomId/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  set(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistService.set(roomId, userId, dto.items);
  }

  @Get(':userId')
  async get(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    const wishlist = await this.wishlistService.get(roomId, userId);
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }
}
