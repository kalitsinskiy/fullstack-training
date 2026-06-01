import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'The ID of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The display name of the user',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'The role of the user',
    example: 'user',
  })
  role: 'user' | 'admin';

  @ApiProperty({
    description: 'The hashed password of the user',
    example: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36iQoeG6Lruj3r0uJ8m',
    required: false,
  })
  passwordHash?: string; // Optional for auth.service
  @ApiProperty({
    description: 'The date and time when the user was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the user was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: {
    _id?: string;
    id?: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    passwordHash?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const idValue = (data.id || data._id)?.toString() || '';
    this.id = idValue;
    this.email = data.email;
    this.displayName = data.displayName;
    this.role = data.role;
    this.passwordHash = data.passwordHash;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
