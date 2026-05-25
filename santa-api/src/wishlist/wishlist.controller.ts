import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@ApiTags('wishlists')
@ApiBearerAuth('JWT')
@Controller('rooms/:roomId/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'Set wishlist for the current user in a room' })
  @ApiParam({ name: 'roomId', description: 'Room MongoDB ID' })
  @ApiResponse({ status: 201, description: 'Wishlist saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  set(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistService.set(roomId, userId, dto.items);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get wishlist for a user in a room' })
  @ApiParam({ name: 'roomId', description: 'Room MongoDB ID' })
  @ApiParam({ name: 'userId', description: 'User MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Wishlist found' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  async get(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const wishlist = await this.wishlistService.get(roomId, userId);
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }
}
