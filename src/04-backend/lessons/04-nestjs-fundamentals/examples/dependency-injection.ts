export {};
// ============================================
// DEPENDENCY INJECTION Example
// ============================================
//
// ⚠️  Run from santa-api/:  cd santa-api && npx ts-node examples/04-nestjs-fundamentals/dependency-injection.ts
//
// Demonstrates how NestJS DI container resolves dependencies.
// The controller depends on the service, and the service depends on a repository.
// NestJS wires everything up automatically based on constructor types.

import 'reflect-metadata';
import {
  Controller, Get, Post, Param, Body, Module, Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// ---- Entity ----

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ---- Repository (low-level data access) ----
// @Injectable() tells NestJS this class can be injected.

@Injectable()
class UsersRepository {
  private store = new Map<string, User>();

  save(user: User): User {
    this.store.set(user.id, user);
    return user;
  }

  findById(id: string): User | undefined {
    return this.store.get(id);
  }

  findAll(): User[] {
    return Array.from(this.store.values());
  }
}

// ---- Service (business logic) ----
// The service injects the repository via the constructor.

@Injectable()
class UsersService {
  // NestJS sees the type UsersRepository and injects the singleton instance
  constructor(private readonly repo: UsersRepository) {}

  create(data: { name: string; email: string }): User {
    const user: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      createdAt: new Date(),
    };
    return this.repo.save(user);
  }

  findOne(id: string): User {
    const user = this.repo.findById(id);
    if (!user) {
      // NestJS built-in exception — automatically returns 404
      throw new NotFoundException(`User "${id}" not found`);
    }
    return user;
  }

  findAll(): User[] {
    return this.repo.findAll();
  }
}

// ---- Controller ----
// The controller injects the service.

@Controller('users')
class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id); // throws 404 if not found
  }

  @Post()
  create(@Body() body: { name: string; email: string }) {
    return this.usersService.create(body);
  }
}

// ---- Module ----
// Both UsersRepository and UsersService must be in `providers`
// so NestJS can resolve the full dependency chain:
//   UsersController -> UsersService -> UsersRepository

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
class UsersModule {}

@Module({
  imports: [UsersModule],
})
class AppModule {}

// ---- Bootstrap ----

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['warn', 'error'] },
  );

  await app.listen(3000, '0.0.0.0');
  console.log('DI Example running on http://localhost:3000');
  console.log('');
  console.log('Dependency chain: Controller -> Service -> Repository');
  console.log('NestJS resolves this automatically from the constructor types.');
  console.log('');
  console.log('Try:');
  console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"Alice","email":"alice@example.com"}\'');
  console.log('  curl http://localhost:3000/users');
  console.log('  curl http://localhost:3000/users/nonexistent  # returns 404');
  console.log('\nPress Ctrl+C to stop.\n');
}

bootstrap();
