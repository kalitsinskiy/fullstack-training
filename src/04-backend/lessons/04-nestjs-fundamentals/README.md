# NestJS Fundamentals

## Quick Overview

NestJS is a framework for building server-side Node.js applications with TypeScript. It provides an opinionated architecture inspired by Angular: modules, controllers, providers, and dependency injection. Unlike raw Fastify/Express, NestJS gives you a structured way to organize large applications. Under the hood it can use either Express or Fastify as the HTTP adapter — we use **Fastify** for performance.

## Key Concepts

### Why NestJS?

Raw Fastify is great for small, focused services (like our `santa-notifications`). But as an API grows — auth, users, rooms, wishlists, assignments — you need conventions:

- **Modular architecture** — split features into isolated modules
- **Dependency injection** — loosely coupled, testable code
- **Decorators** — declarative routing, validation, guards
- **Built-in tooling** — CLI scaffolding, OpenAPI generation, testing utilities

### Architecture: Modules, Controllers, Providers

Every NestJS app is a tree of **modules**. Each module groups related functionality:

```
AppModule
├── UsersModule
│   ├── UsersController   (handles HTTP requests)
│   └── UsersService      (business logic)
├── RoomsModule
│   ├── RoomsController
│   └── RoomsService
└── ...
```

- **Module** (`@Module`) — organizes the app; declares controllers, providers, imports, exports
- **Controller** (`@Controller`) — maps HTTP routes to handler methods
- **Provider** (`@Injectable`) — any class that can be injected (services, repositories, helpers)

### Decorators

NestJS uses TypeScript decorators extensively:

```typescript
import { Module, Controller, Injectable, Get, Post, Param, Body } from '@nestjs/common';

@Injectable()
class UsersService {
  private users: Array<{ id: string; name: string }> = [];

  findAll() { return this.users; }
  findOne(id: string) { return this.users.find(u => u.id === id); }
  create(data: { name: string }) {
    const user = { id: crypto.randomUUID(), name: data.name };
    this.users.push(user);
    return user;
  }
}

@Controller('users')
class UsersController {
  constructor(private readonly usersService: UsersService) {} // DI

  @Get()
  findAll() { return this.usersService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.usersService.findOne(id); }

  @Post()
  create(@Body() body: { name: string }) { return this.usersService.create(body); }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
class UsersModule {}
```

### Dependency Injection

NestJS has a built-in IoC (Inversion of Control) container. When a controller declares a constructor parameter with a type, NestJS automatically resolves and injects it:

```typescript
@Injectable()
class DatabaseService {
  query(sql: string) { /* ... */ }
}

@Injectable()
class UsersService {
  // NestJS sees the type hint and injects a DatabaseService instance
  constructor(private readonly db: DatabaseService) {}
}
```

Rules:
1. The class must be decorated with `@Injectable()`
2. The class must be registered as a **provider** in a module
3. If you want to use a provider from another module, that module must **export** it

```typescript
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // makes it available to other modules
})
class DatabaseModule {}

@Module({
  imports: [DatabaseModule], // now UsersService can inject DatabaseService
  controllers: [UsersController],
  providers: [UsersService],
})
class UsersModule {}
```

### NestJS with Fastify Adapter

By default NestJS uses Express. We switch to Fastify for better performance:

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.listen(3001, '0.0.0.0'); // 0.0.0.0 needed for Docker
}
bootstrap();
```

Install:
```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-fastify fastify
```

Key difference from Express adapter: Fastify uses `request.body` (not `req.body`), and some Express-specific middleware may not work. NestJS abstracts most of this away, so your controllers stay the same.

### Project Structure Conventions

```
src/
├── main.ts                         # bootstrap, create app
├── app.module.ts                   # root module
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── user.entity.ts
├── rooms/
│   ├── rooms.module.ts
│   ├── rooms.controller.ts
│   ├── rooms.service.ts
│   └── dto/
│       └── create-room.dto.ts
└── common/
    ├── filters/
    ├── guards/
    ├── interceptors/
    └── pipes/
```

One folder per feature module. DTOs, entities, and other related files live inside the feature folder.

### NestJS CLI

Scaffold quickly:
```bash
npm i -g @nestjs/cli
nest new santa-api                  # create project
cd santa-api
npm install @nestjs/platform-fastify fastify
nest generate module users          # generate module
nest generate controller users      # generate controller
nest generate service users         # generate service
nest g resource rooms               # module + controller + service + DTOs at once
```

### HTTP Method Decorators

```typescript
@Controller('items')
class ItemsController {
  @Get()           findAll() {}        // GET    /items
  @Get(':id')      findOne() {}        // GET    /items/:id
  @Post()          create() {}         // POST   /items
  @Put(':id')      replace() {}        // PUT    /items/:id
  @Patch(':id')    update() {}         // PATCH  /items/:id
  @Delete(':id')   remove() {}         // DELETE /items/:id
}
```

### Parameter Decorators

```typescript
@Post()
create(
  @Body() body: CreateItemDto,           // full body
  @Body('name') name: string,            // single field from body
  @Param('id') id: string,              // route parameter
  @Query('page') page: string,          // query string parameter
  @Headers('authorization') auth: string, // header value
  @Req() request: FastifyRequest,        // raw Fastify request
  @Res() reply: FastifyReply,            // raw Fastify reply
) {}
```

### Response Handling

By default, NestJS serializes the return value to JSON with status 200 (GET) or 201 (POST). Override with decorators:

```typescript
import { HttpCode, HttpStatus, Header } from '@nestjs/common';

@Post()
@HttpCode(HttpStatus.NO_CONTENT)  // 204
@Header('X-Custom', 'value')
create(@Body() dto: CreateItemDto) {
  // returning nothing with 204
}
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS First Steps](https://docs.nestjs.com/first-steps)
- [Controllers](https://docs.nestjs.com/controllers)
- [Providers](https://docs.nestjs.com/providers)
- [Modules](https://docs.nestjs.com/modules)
- [NestJS with Fastify](https://docs.nestjs.com/techniques/performance)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)

## How to Work

> **Important:** NestJS examples and exercises must run from the `santa-api/` directory.
> NestJS depends on `reflect-metadata`, `rxjs`, and a `tsconfig.json` with `"emitDecoratorMetadata": true` —
> all of which are set up inside `santa-api/`. Running from the repo root will fail.
>
> **Note:** First run takes ~10 seconds — `ts-node` compiles NestJS + all its dependencies on cold start. Subsequent runs are faster.

1. **Study examples** (run from `santa-api/`):
   ```bash
   cd santa-api
   npx ts-node examples/04-nestjs-fundamentals/basic-controller.ts
   npx ts-node examples/04-nestjs-fundamentals/dependency-injection.ts
   npx ts-node examples/04-nestjs-fundamentals/module-structure.ts
   ```

2. **Complete exercises** (run from `santa-api/`):
   ```bash
   cd santa-api
   npx ts-node exercises/04-nestjs-fundamentals/mini-crud.ts
   ```

3. **Complete the App Task** below.

## App Task

See [exercises/app-task.md](exercises/app-task.md) — bootstrap `santa-api`, then build `UsersModule` and `RoomsModule`.
