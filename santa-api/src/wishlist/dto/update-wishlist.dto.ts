import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WishlistItemDto {
  @ApiProperty({
    description: 'The name of the wishlist item',
    example: 'New Bicycle',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: 'A URL to the wishlist item',
    example: 'https://example.com/new-bicycle',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'The priority of the wishlist item',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export default class UpdateWishlistDto {
  @ApiProperty({
    description: 'The ID of the user whose wishlist is being updated',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'The list of wishlist items to update',
    type: [WishlistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
