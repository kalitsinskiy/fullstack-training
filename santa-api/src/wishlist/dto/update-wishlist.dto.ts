import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WishlistItemDto {
  @ApiProperty({
    example: 'LEGO Star Wars set',
    description: 'Item name',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/item',
    description: 'URL to the item',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Priority (lower = higher priority)',
  })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateWishlistDto {
  @ApiProperty({
    type: [WishlistItemDto],
    description: 'List of wishlist items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
