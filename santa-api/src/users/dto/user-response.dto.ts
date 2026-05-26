import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name visible to other users',
    example: 'Alex',
  })
  displayName!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'alex@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Role assigned to the user',
    enum: ['user', 'admin'],
    example: 'user',
  })
  role!: 'user' | 'admin';
}
