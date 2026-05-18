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
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class UpdateWishlistDto {
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items!: WishlistItemDto[];
}
