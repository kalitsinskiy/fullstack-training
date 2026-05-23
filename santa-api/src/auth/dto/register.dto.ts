import { IsEmail, IsString, MinLength } from 'class-validator';

export default class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  password: string;

  @IsString()
  @MinLength(2)
  displayName: string;
}
