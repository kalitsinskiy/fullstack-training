import { ApiProperty } from '@nestjs/swagger';

export class InternalUserResponseDto {
  @ApiProperty({ example: '665f0c2ab7d13a5e8b1c4d9f' })
  id!: string;

  @ApiProperty({ example: 'Alice' })
  displayName!: string;

  @ApiProperty({ example: 'alice@example.com' })
  email!: string;
}
