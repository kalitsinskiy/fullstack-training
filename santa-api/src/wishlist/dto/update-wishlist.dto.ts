import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WishlistItemDto {
  @ApiProperty({
    description: 'Display name of item',
    example: 'Tesla',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    description: 'Product page for wishlist item',
    example: 'test-page',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'Priority rank for the item, where lower means more important',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priority?: number;
}

export class UpdateWishlistDto {
  @ApiProperty({
    description: 'Wishlist items that should replace current wishlist',
    type: () => WishlistItemDto,
    isArray: true,
    example: [
      {
        name: 'Tesla',
        url: 'test-page',
        priority: 1,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items!: WishlistItemDto[];
}
