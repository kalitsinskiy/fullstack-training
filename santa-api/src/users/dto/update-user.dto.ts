import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The new display name of the user',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'The new display name of the user',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;
}
