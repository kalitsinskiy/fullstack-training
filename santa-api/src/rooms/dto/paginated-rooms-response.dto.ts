import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { RoomResponseDto } from './room-response.dto';

export class PaginatedRoomsResponseDto {
  @ApiProperty({
    description: 'Rooms visible to the authenticated user',
    type: () => RoomResponseDto,
    isArray: true,
  })
  data!: RoomResponseDto[];

  @ApiProperty({
    description: 'Pagination details for the current result set',
    type: () => PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
