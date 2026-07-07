import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Created user identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  id!: string;

  @ApiProperty({
    description: 'Created user email address',
    example: 'alex@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Created user display name',
    example: 'Alex',
  })
  displayName!: string;

  @ApiProperty({
    description: 'JWT access token used for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;
}
