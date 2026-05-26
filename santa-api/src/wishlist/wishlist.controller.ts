import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('wishlists')
@ApiBearerAuth('JWT')
@Controller('rooms/:roomId/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'Set wishlist items for current user in a room' })
  @ApiParam({ name: 'roomId', description: 'Room MongoDB ObjectId' })
  @ApiResponse({ status: 201, description: 'Wishlist updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  set(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistService.set(roomId, userId, dto.items);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get wishlist of a user in a room' })
  @ApiParam({ name: 'roomId', description: 'Room MongoDB ObjectId' })
  @ApiParam({ name: 'userId', description: 'User MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Returns the wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  get(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const wishlist = this.wishlistService.get(roomId, userId);
    if (!wishlist) {
      throw new NotFoundException(
        `Wishlist for user "${userId}" in room "${roomId}" not found`,
      );
    }
    return wishlist;
  }
}
