import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 12, description: 'Total number of matching items' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Items returned per page' })
  limit!: number;

  @ApiProperty({ example: 2, description: 'Total number of pages' })
  totalPages!: number;
}
