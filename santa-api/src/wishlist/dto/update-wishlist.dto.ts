import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WishlistItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateWishlistDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
