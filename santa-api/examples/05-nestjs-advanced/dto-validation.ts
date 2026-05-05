export {};
// ============================================
// DTO VALIDATION Example
// ============================================
// Run: npx ts-node src/04-backend/lessons/05-nestjs-advanced/examples/dto-validation.ts
//
// Demonstrates class-validator DTOs with NestJS ValidationPipe.
// Sends valid and invalid requests to show how validation works.

import 'reflect-metadata';
import {
  Controller, Post, Body, Module, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { IsString, IsEmail, MinLength, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

// ---- DTOs ----
// Each property is decorated with class-validator decorators.
// ValidationPipe checks these rules before the handler runs.

enum Priority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high' }

class CreateTaskDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority, { message: 'Priority must be low, medium, or high' })
  priority!: Priority;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  weight?: number;
}

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;
}

// ---- Controller ----

@Controller()
class AppController {
  @Post('tasks')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createTask(@Body() dto: CreateTaskDto) {
    return { message: 'Task created', task: dto };
  }

  @Post('users')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createUser(@Body() dto: CreateUserDto) {
    return { message: 'User created', user: dto };
  }
}

@Module({ controllers: [AppController] })
class AppModule {}

// ---- Bootstrap & Demo ----

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['warn', 'error'] },
  );

  await app.listen(3000, '0.0.0.0');

  console.log('DTO Validation Example running on http://localhost:3000\n');

  // Helper to make requests and show results
  const baseUrl = 'http://localhost:3000';

  async function testRequest(label: string, url: string, body: Record<string, unknown>) {
    console.log(`--- ${label} ---`);
    console.log(`POST ${url}`);
    console.log('Body:', JSON.stringify(body));
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.log('Error:', err);
    }
    console.log('');
  }

  // Valid task
  await testRequest('Valid task', '/tasks', {
    title: 'Fix bug',
    priority: 'high',
    weight: 5,
  });

  // Invalid task — title too short, invalid priority
  await testRequest('Invalid task', '/tasks', {
    title: 'X',
    priority: 'urgent',
  });

  // Task with unknown field — stripped (whitelist) or rejected (forbidNonWhitelisted)
  await testRequest('Task with unknown field', '/tasks', {
    title: 'Valid title',
    priority: 'low',
    hackField: 'should be rejected',
  });

  // Valid user
  await testRequest('Valid user', '/users', {
    name: 'Alice',
    email: 'alice@example.com',
  });

  // Invalid user — bad email
  await testRequest('Invalid user — bad email', '/users', {
    name: 'Bob',
    email: 'not-an-email',
  });

  await app.close();
  console.log('Done! Check the responses above to see validation in action.');
}

bootstrap();
