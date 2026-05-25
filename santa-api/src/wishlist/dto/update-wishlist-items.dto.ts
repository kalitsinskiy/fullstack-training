import { Type } from 'class-transformer';
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
import {
  ApiProperty,
  ApiPropertyOptional,
} from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

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

export class UpdateWishlistItemsDto {
  @ApiProperty({
    description: 'The list of wishlist items to update',
    type: [WishlistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
