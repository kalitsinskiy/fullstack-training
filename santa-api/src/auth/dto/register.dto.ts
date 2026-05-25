import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export default class RegisterDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'strongpassword123',
  })
  @IsString()
  @MinLength(10)
  password: string;

  @ApiProperty({
    description: 'The display name of the user',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  displayName: string;
}
