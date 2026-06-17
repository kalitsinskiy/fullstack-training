import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Name of the Secret Santa room',
    example: 'New Year team building',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name!: string;
}
