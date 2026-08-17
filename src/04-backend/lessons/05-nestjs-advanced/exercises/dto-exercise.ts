/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// DTO EXERCISE
// ============================================
// Run from santa-api/:  npx ts-node exercises/05-nestjs-advanced/dto-exercise.ts
//
// Create DTOs with class-validator for a "task management" API.
// The app should validate all inputs and reject invalid data.

import 'reflect-metadata';
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Module,
  Injectable,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';

// ---- Enums ----

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

// ---- DTOs ----

// TODO 1: Create a CreateTaskDto with these validations:
//   - title: required string, min 3 chars, max 100 chars
//   - description: optional string, max 500 chars
//   - priority: required, must be a value from TaskPriority enum
//   - dueDate: optional, must be a valid ISO date string (use @IsDateString)
//   - tags: optional array of strings, each tag min 1 char, max 20 chars

class CreateTaskDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(20, { each: true })
  tags?: string[];
}

// TODO 2: Create an UpdateTaskDto with these validations:
//   - title: optional string, min 3 chars, max 100 chars
//   - description: optional string, max 500 chars
//   - priority: optional, must be a value from TaskPriority enum
//   - status: optional, must be a value from TaskStatus enum
//   - dueDate: optional, must be a valid ISO date string
//   - tags: optional array of strings
//   (Hint: all fields are @IsOptional() since it is a partial update)

class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(20, { each: true })
  tags?: string[];
}

// TODO 3: Create an AssignTaskDto with:
//   - userId: required string, must be a valid UUID

class AssignTaskDto {
  @IsUUID()
  userId!: string;
}

// ---- Types ----

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  tags: string[];
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Service ----

// This is provided — no TODOs here
@Injectable()
class TasksService {
  private tasks = new Map<string, Task>();

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return task;
  }

  create(dto: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    tags?: string[];
  }): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: TaskStatus.TODO,
      dueDate: dto.dueDate,
      tags: dto.tags ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, dto: Partial<Task>): Task {
    const task = this.findOne(id);
    const updated = { ...task, ...dto, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  assign(id: string, userId: string): Task {
    const task = this.findOne(id);
    task.assigneeId = userId;
    task.updatedAt = new Date();
    return task;
  }
}

// ---- Controller ----

// TODO 4: Create a TasksController with prefix 'tasks'
// - Inject TasksService
// - Implement these endpoints using YOUR DTOs for validation:
//
//   GET /tasks              -> return all tasks
//   GET /tasks/:id          -> return one task
//   POST /tasks             -> create task (validate with CreateTaskDto)
//   PUT /tasks/:id          -> update task (validate with UpdateTaskDto)
//   POST /tasks/:id/assign  -> assign task (validate with AssignTaskDto)

@Controller('tasks')
class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Put(':id')
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Post(':id/assign')
  assignTask(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(id, dto.userId);
  }
}

// ---- Module ----

// TODO 5: Create TasksModule with controller and service

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
class TasksModule {}

// ---- App Module ----

// TODO 6: Create AppModule importing TasksModule

@Module({
  imports: [TasksModule],
})
class AppModule {}

// ---- Bootstrap ----

// TODO 7: Bootstrap with FastifyAdapter on port 3000
// IMPORTANT: Add global ValidationPipe with these options:
//   whitelist: true
//   forbidNonWhitelisted: true
//   transform: true
//
// Test with:
//   # Valid task
//   curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
//     -d '{"title":"Fix login bug","priority":"high","tags":["bug","auth"]}'
//
//   # Invalid — title too short
//   curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
//     -d '{"title":"X","priority":"high"}'
//
//   # Invalid — bad priority
//   curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
//     -d '{"title":"Some task","priority":"urgent"}'
//
//   # Invalid — unknown field rejected
//   curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
//     -d '{"title":"Some task","priority":"low","hacked":true}'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ['warn', 'error'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen(3000, '0.0.0.0');

  console.log('DTO exercise running on http://localhost:3000');
  console.log(
    `curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Fix login bug","priority":"high","tags":["bug","auth"]}'`
  );
}

bootstrap();
