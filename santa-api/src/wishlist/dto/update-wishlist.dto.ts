import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WishlistItemDto {
  @ApiProperty({ example: 'Mechanical keyboard', description: 'Item name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/product',
    description: 'Product URL',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Priority (lower = higher priority)',
  })
  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class UpdateWishlistDto {
  @ApiProperty({
    type: [WishlistItemDto],
    description: 'List of wishlist items',
  })
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items!: WishlistItemDto[];
}
