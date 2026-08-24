import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { CURRENCIES } from './create-room.dto';

// All fields optional — edit just the name, budget, currency, or exchange date.
export class UpdateRoomDto {
  @ApiPropertyOptional({
    description: 'New room name',
    minLength: 3,
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @Length(3, 60)
  name?: string;

  @ApiPropertyOptional({
    description: 'Per-gift budget amount',
    minimum: 1,
    maximum: 1000000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  budget?: number;

  @ApiPropertyOptional({ description: 'Currency symbol', enum: CURRENCIES })
  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Gift-exchange date (ISO 8601)',
    example: '2026-12-24',
  })
  // Pin to a real calendar day: @IsISO8601 alone accepts week/ordinal forms that
  // new Date() turns into Invalid Date when the update is persisted.
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'exchangeDate must be a calendar date (YYYY-MM-DD)',
  })
  exchangeDate?: string;
}
