import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered user email address',
    example: 'alex@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'secret123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
