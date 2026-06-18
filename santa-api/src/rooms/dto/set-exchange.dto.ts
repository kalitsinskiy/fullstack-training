import { IsDateString, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetExchangeDto {
  @ApiProperty({
    example: '2026-12-24T18:00:00.000Z',
    description: 'When the gift exchange happens (ISO 8601)',
  })
  @IsDateString()
  exchangeDate!: string;

  @ApiProperty({ example: 'Office, 2nd floor, room 220' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  exchangePlace!: string;
}
