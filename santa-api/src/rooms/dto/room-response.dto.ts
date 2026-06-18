import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty({ example: '6a1959b19080f995c722c00d' }) id!: string;
  @ApiProperty({ example: 'Office Party 2026' }) name!: string;
  @ApiProperty({ example: '6a15a51b445eec80c0113052' }) ownerId!: string;
  @ApiProperty({ example: 'BL9CDK' }) code!: string;
  @ApiProperty({ type: [String], example: ['6a15a51b445eec80c0113052'] })
  members!: string[];
  @ApiProperty({ enum: ['pending', 'drawn', 'closed'], example: 'drawn' })
  status!: 'pending' | 'drawn' | 'closed';
  @ApiPropertyOptional({ example: '2026-12-20T00:00:00.000Z' })
  drawDate?: string;
  @ApiPropertyOptional({ example: '2026-12-24T18:00:00.000Z' })
  exchangeDate?: string;
  @ApiPropertyOptional({ example: 'Office, 5th-floor kitchen' })
  exchangePlace?: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'giverId → recipientId (present after draw).',
  })
  assignments?: Record<string, string>;
  @ApiProperty({ example: '2026-05-29T09:17:37.783Z' }) createdAt!: string;
}
