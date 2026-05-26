import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address used to sign in',
    example: 'alex@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'secret123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Display name shown to other room members',
    example: 'Alex',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName!: string;
}
