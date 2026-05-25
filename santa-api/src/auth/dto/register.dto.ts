import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alice@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'supersecret',
    description: 'Password (min 8 chars)',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Alice', description: 'Display name (1–50 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName!: string;
}
