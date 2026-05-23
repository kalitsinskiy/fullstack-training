import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(10)
  passwordHash: string;

  @IsEmail()
  email: string;
}
