import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

// The draw sets the gift-exchange date so everyone knows the day once names are
// drawn. Required — you can't run the draw without picking a date.
export class DrawRoomDto {
  @ApiProperty({
    description: 'The day participants exchange gifts (ISO 8601)',
    example: '2026-12-24',
  })
  @IsISO8601()
  exchangeDate!: string;
}
