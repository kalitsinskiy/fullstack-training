import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';


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
