export {};
// ============================================
// MODULE STRUCTURE Example
// ============================================
//
// ⚠️  Run from santa-api/:  cd santa-api && npx ts-node examples/04-nestjs-fundamentals/module-structure.ts
//
// Demonstrates multi-module NestJS app with imports/exports.
// - SharedModule exports a ConfigService used by multiple modules
// - CatsModule and DogsModule both import SharedModule
// - AppModule ties everything together

import 'reflect-metadata';
import { Controller, Get, Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// ============================================
// SharedModule — provides ConfigService to other modules
// ============================================

@Injectable()
class ConfigService {
  private config: Record<string, string> = {
    APP_NAME: 'Pet Store',
    VERSION: '1.0.0',
  };

  get(key: string): string {
    return this.config[key] ?? 'unknown';
  }
}

@Module({
  providers: [ConfigService],
  exports: [ConfigService], // <-- this makes ConfigService available to importers
})
class SharedModule {}

// ============================================
// CatsModule — imports SharedModule to use ConfigService
// ============================================

@Injectable()
class CatsService {
  private cats = ['Whiskers', 'Felix', 'Garfield'];

  constructor(private readonly config: ConfigService) {
    // ConfigService is injected because CatsModule imports SharedModule
    console.log(`[CatsService] Initialized in app: ${this.config.get('APP_NAME')}`);
  }

  findAll(): string[] {
    return this.cats;
  }
}

@Controller('cats')
class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  findAll() {
    return { cats: this.catsService.findAll() };
  }
}

@Module({
  imports: [SharedModule], // <-- imports SharedModule to get ConfigService
  controllers: [CatsController],
  providers: [CatsService],
})
class CatsModule {}

// ============================================
// DogsModule — also imports SharedModule
// ============================================

@Injectable()
class DogsService {
  private dogs = ['Rex', 'Buddy', 'Max'];

  constructor(private readonly config: ConfigService) {
    console.log(`[DogsService] Initialized in app: ${this.config.get('APP_NAME')}`);
  }

  findAll(): string[] {
    return this.dogs;
  }
}

@Controller('dogs')
class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @Get()
  findAll() {
    return { dogs: this.dogsService.findAll() };
  }
}

@Module({
  imports: [SharedModule],
  controllers: [DogsController],
  providers: [DogsService],
})
class DogsModule {}

// ============================================
// AppModule — root module that imports feature modules
// ============================================

@Controller()
class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  root() {
    return {
      app: this.config.get('APP_NAME'),
      version: this.config.get('VERSION'),
      endpoints: ['/cats', '/dogs'],
    };
  }
}

@Module({
  imports: [SharedModule, CatsModule, DogsModule],
  controllers: [AppController],
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

  console.log('\nModule Structure Example running on http://localhost:3000');
  console.log('');
  console.log('Module tree:');
  console.log('  AppModule');
  console.log('  ├── SharedModule (exports ConfigService)');
  console.log('  ├── CatsModule (imports SharedModule)');
  console.log('  └── DogsModule (imports SharedModule)');
  console.log('');
  console.log('Try:');
  console.log('  curl http://localhost:3000');
  console.log('  curl http://localhost:3000/cats');
  console.log('  curl http://localhost:3000/dogs');
  console.log('\nPress Ctrl+C to stop.\n');
}

bootstrap();
