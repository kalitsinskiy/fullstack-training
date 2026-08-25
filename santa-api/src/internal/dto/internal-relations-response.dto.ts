import { ApiProperty } from '@nestjs/swagger';

export class InternalRelationsResponseDto {
  @ApiProperty({ example: '665f0c2ab7d13a5e8b1c4d9f', nullable: true })
  gifteeId!: string | null;

  @ApiProperty({ example: '665f0c2ab7d13a5e8b1c4d1a', nullable: true })
  santaId!: string | null;
}
