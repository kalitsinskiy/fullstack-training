import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// The draw sets the gift-exchange date so everyone knows the day once names are
// drawn. Required — you can't run the draw without picking a date.
export class DrawRoomDto {
  @ApiProperty({
    description: 'The day participants exchange gifts (ISO 8601)',
    example: '2026-12-24',
  })
  @IsISO8601()
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
