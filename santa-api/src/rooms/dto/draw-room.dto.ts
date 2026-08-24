import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

// The draw sets the gift-exchange date so everyone knows the day once names are
// drawn. Required — you can't run the draw without picking a date.
export class DrawRoomDto {
  @ApiProperty({
    description: 'The day participants exchange gifts (ISO 8601)',
    example: '2026-12-24',
  })
  // The contract is a calendar day. @IsISO8601 alone accepts forms new Date()
  // can't parse (week dates like 2026-W52-2, ordinal dates), which then become
  // Invalid Date downstream — so pin the date-only shape and require a real date.
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'exchangeDate must be a calendar date (YYYY-MM-DD)',
  })
  exchangeDate!: string;

  @ApiPropertyOptional({ description: 'Suggested per-gift budget amount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  budget?: number;

  @ApiPropertyOptional({ description: 'Currency code for the budget' })
  @IsOptional()
  @IsString()
  currency?: string;
}
