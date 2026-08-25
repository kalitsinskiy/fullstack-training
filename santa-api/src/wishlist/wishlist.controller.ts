import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../rooms/decorators/require-permissions.decorator';
import { RoomPermissionsGuard } from '../rooms/guards/room-permissions.guard';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { WishlistService } from './wishlist.service';
import type { Wishlist } from './wishlist.types';

@ApiTags('wishlists')
@ApiBearerAuth('JWT')
@Controller('rooms/:roomId/wishlist')
@UseGuards(JwtAuthGuard, RoomPermissionsGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Put()
  @RequirePermissions('wishlist:set')
  @ApiOperation({
    summary: "Set the current user's wishlist for a room",
    description: 'Creates or replaces the authenticated user wishlist items.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room identifier that owns the wishlist',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  @ApiBody({ type: UpdateWishlistDto })
  @ApiResponse({
    status: 200,
    description: 'Wishlist saved successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing wishlist:set permission' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  set(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() body: UpdateWishlistDto,
  ): Promise<Wishlist> {
    return this.wishlistService.set(roomId, userId, body.items);
  }

  @Get(':userId')
  @RequirePermissions('room:view')
  @ApiOperation({
    summary: "Get a user's wishlist for a room",
    description: 'Returns the wishlist items for the given user in the room.',
  })
  @ApiParam({ name: 'roomId', example: '665f0c2ab7d13a5e8b1c4d9f' })
  @ApiParam({ name: 'userId', example: '665f0c2ab7d13a5e8b1c4d1a' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist returned successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing room:view permission' })
  @ApiResponse({ status: 404, description: 'Room not found / not a participant' })
  async findOne(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ): Promise<Wishlist> {
    // Returns an empty wishlist ({ items: [] }) if the user has none yet.
    return this.wishlistService.get(roomId, userId);
  }
}
