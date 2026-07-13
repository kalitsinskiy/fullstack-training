import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export const CURRENCIES = ['$', '€', '£', '₴', 'zł'] as const;

export class CreateRoomDto {
  @ApiProperty({
    description: 'Name of the Secret Santa room',
    example: 'New Year team building',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    description: 'Suggested per-gift budget amount',
    example: 500,
    minimum: 1,
    maximum: 1000000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  budget?: number;

  @ApiPropertyOptional({
    description: 'Currency symbol for the budget',
    example: '₴',
    enum: CURRENCIES,
  })
  @IsOptional()
  @IsIn(CURRENCIES as unknown as string[])
  currency?: string;
}
