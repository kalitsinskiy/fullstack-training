import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoomDto {
  @ApiPropertyOptional({
    description: 'The new name of the room',
    example: 'Updated Room Name',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;
}
