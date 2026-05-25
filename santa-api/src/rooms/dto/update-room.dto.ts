import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

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
