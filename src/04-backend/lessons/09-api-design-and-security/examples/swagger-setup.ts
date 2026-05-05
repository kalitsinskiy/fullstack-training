// ============================================
// Swagger / OpenAPI Setup for NestJS
// ============================================
// This file is a reference for setting up Swagger in a NestJS application.
// Read and adapt these patterns for the App Task.
// It is NOT directly runnable — apply it within your NestJS app.

// --- 1. Install ---
// npm install @nestjs/swagger

// --- 2. Setup in main.ts ---

/*
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Secret Santa API')
    .setDescription('API for managing Secret Santa rooms, wishlists, and assignments')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',    // security scheme name — referenced by @ApiBearerAuth('JWT')
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('rooms', 'Room management')
    .addTag('wishlists', 'Wishlist management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,  // keep auth token between page refreshes
    },
  });

  await app.listen(3001, '0.0.0.0');
  console.log('API docs: http://localhost:3001/docs');
}
bootstrap();
*/

// --- 3. Controller decorators ---

/*
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('rooms')                           // group endpoints under "rooms" tag
@ApiBearerAuth('JWT')                       // all endpoints require JWT auth
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  @Post()
  @ApiOperation({ summary: 'Create a new Secret Santa room' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: RoomResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get rooms for the current user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of rooms' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roomsService.findByUser(userId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific room by ID' })
  @ApiParam({ name: 'id', description: 'Room MongoDB ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Room found', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async findOne(@Param('id') id: string): Promise<RoomResponseDto> {
    return this.roomsService.findById(id);
  }
}
*/

// --- 4. DTO decorators ---

/*
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsDateString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Name of the Secret Santa room',
    example: 'Office Party 2025',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Date when the Secret Santa draw will happen',
    example: '2025-12-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  drawDate?: string;
}

export class RoomResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Office Party 2025' })
  name: string;

  @ApiProperty({ example: 'ABC123XY' })
  inviteCode: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'drawn'] })
  status: string;

  @ApiProperty({ example: 3 })
  participantCount: number;
}

// For paginated responses, you can use a generic pattern:
export class PaginationMetaDto {
  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
*/

export {};
