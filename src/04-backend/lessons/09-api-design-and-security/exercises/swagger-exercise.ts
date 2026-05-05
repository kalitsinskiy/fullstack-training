// ============================================
// Exercise: Add Swagger Decorators
// ============================================
// This exercise is meant to be applied in your NestJS app.
// Read the controller below and add the missing Swagger decorators.
// Then verify the docs appear correctly at http://localhost:3001/docs.

// --- Instructions ---
// For each TODO below, add the appropriate Swagger decorator.
// Reference: https://docs.nestjs.com/openapi/decorators

/*

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
// JwtAuthGuard and CurrentUser come from your AuthModule (Lesson 08).
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// TODO 1: Import the necessary Swagger decorators
// Hints: ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery,
//        ApiBearerAuth, ApiProperty, ApiPropertyOptional

// ============================================
// TODO 2: Add Swagger decorators to the DTO
// ============================================
// Add @ApiProperty or @ApiPropertyOptional to each field
// Include: description, example, and constraints (minLength, maxLength, etc.)

class CreateWishlistItemDto {
  // TODO: @ApiProperty(...)
  name: string;

  // TODO: @ApiPropertyOptional(...)
  url?: string;

  // TODO: @ApiPropertyOptional(...)
  priority?: number;

  // TODO: @ApiPropertyOptional(...)
  notes?: string;
}

class UpdateWishlistItemDto {
  // TODO: @ApiPropertyOptional(...)
  name?: string;

  // TODO: @ApiPropertyOptional(...)
  url?: string;

  // TODO: @ApiPropertyOptional(...)
  priority?: number;

  // TODO: @ApiPropertyOptional(...)
  notes?: string;
}

// ============================================
// TODO 3: Add Swagger decorators to the controller
// ============================================
// Add:
//   - @ApiTags on the controller class
//   - @ApiBearerAuth on the controller class
//   - @ApiOperation on each method (summary + description)
//   - @ApiResponse for each possible response status
//   - @ApiParam for path parameters
//   - @ApiQuery for query parameters

// TODO: @ApiTags(...)
// TODO: @ApiBearerAuth(...)
@Controller('rooms/:roomId/wishlists')
@UseGuards(JwtAuthGuard)
class WishlistController {
  // TODO: Add Swagger decorators
  @Post()
  async addItem(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWishlistItemDto,
  ) {
    // Adds a new item to the user's wishlist for this room
    return { message: 'Item added' };
  }

  // TODO: Add Swagger decorators
  @Get()
  async getWishlist(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Returns the user's wishlist items for this room (paginated)
    return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }

  // TODO: Add Swagger decorators
  @Put(':itemId')
  async updateItem(
    @Param('roomId') roomId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWishlistItemDto,
  ) {
    // Updates a specific wishlist item
    return { message: 'Item updated' };
  }

  // TODO: Add Swagger decorators
  @Delete(':itemId')
  async removeItem(
    @Param('roomId') roomId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Removes a specific wishlist item
    return { message: 'Item removed' };
  }
}

*/

// ============================================
// Checklist — verify these in Swagger UI:
// ============================================
// [ ] The "wishlists" tag appears in the sidebar
// [ ] Each endpoint shows a summary and description
// [ ] Request bodies show field descriptions and examples
// [ ] Response codes (200, 201, 400, 401, 404) are documented
// [ ] Path parameters (roomId, itemId) have descriptions
// [ ] Query parameters (page, limit) appear for the GET endpoint
// [ ] The lock icon appears (ApiBearerAuth) and you can enter a JWT

export {};
