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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishlistService } from './wishlist.service';
import type { Wishlist } from './wishlist.types';

@ApiTags('wishlists')
@ApiBearerAuth('JWT')
@Controller('rooms/:roomId/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({
    summary: 'Replace user wishlist',
    description: 'Creates or replaces user wishlist items for selected room.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room identifier that owns wishlist',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({
    status: 201,
    description: 'Wishlist saved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for one or more wishlist items',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  update(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateWishlistDto,
  ): Promise<Wishlist> {
    return this.wishlistService.set(roomId, userId, body.items);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get the current user wishlist for a room',
    description: 'Returns authenticated user wishlist items for selected room.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room identifier that owns wishlist',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiResponse({
    status: 200,
    description: 'Wishlist returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wishlist was not found for current user in this room',
  })
  async findOne(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Wishlist> {
    const wishlist = await this.wishlistService.get(roomId, userId);

    if (!wishlist) {
      throw new NotFoundException(
        `Wishlist for room ${roomId} and user ${userId} not found`,
      );
    }

    return wishlist;
  }
}
