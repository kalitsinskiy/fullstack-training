import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The display name of the user',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  displayName: string;

  @ApiProperty({
    description: 'The hashed password of the user',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36iQoeG6Lruj3r0uJ8m',
  })
  @IsString()
  @MinLength(10)
  passwordHash: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;
}
