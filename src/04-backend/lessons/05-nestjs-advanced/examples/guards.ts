export {};
// ============================================
// GUARDS Example
// ============================================
// Run: npx ts-node src/04-backend/lessons/05-nestjs-advanced/examples/guards.ts
//
// Demonstrates two guards:
// 1. ApiKeyGuard — checks for a valid x-api-key header
// 2. RolesGuard — checks user role from a custom header (simulated auth)

import 'reflect-metadata';
import {
  Controller, Get, Module, Injectable, UseGuards, SetMetadata,
  CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// ============================================
// Guard 1: API Key Guard
// ============================================
// Checks if the request has a valid x-api-key header.
// If not, throws UnauthorizedException (401).

const VALID_API_KEY = 'secret-123';

@Injectable()
class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (apiKey !== VALID_API_KEY) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}

// ============================================
// Guard 2: Roles Guard (with custom decorator)
// ============================================
// Uses a custom @Roles() decorator to set required roles on the handler.
// The guard reads the metadata and checks the user's role from a header.

// Custom decorator — stores metadata on the handler
const ROLES_KEY = 'roles';
const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the roles set by @Roles() decorator
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

    // If no @Roles() decorator, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // In a real app, you'd extract the user from a JWT token.
    // Here we simulate it with a header.
    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'] as string;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Requires one of roles: ${requiredRoles.join(', ')}. You have: ${userRole || 'none'}`,
      );
    }

    return true;
  }
}

// ============================================
// Controller
// ============================================

@Controller()
@UseGuards(ApiKeyGuard) // Applied to ALL routes in this controller
class AppController {
  @Get('public-data')
  getPublicData() {
    return { message: 'This only needs an API key' };
  }

  @Get('admin-data')
  @UseGuards(RolesGuard)  // Additional guard for this route
  @Roles('admin')         // Only admin role
  getAdminData() {
    return { message: 'Secret admin data', secret: 42 };
  }

  @Get('editor-data')
  @UseGuards(RolesGuard)
  @Roles('admin', 'editor') // Admin or editor
  getEditorData() {
    return { message: 'Editor content' };
  }
}

@Module({
  controllers: [AppController],
  providers: [RolesGuard], // RolesGuard needs Reflector, so it must be a provider
})
class AppModule {}

// ---- Bootstrap & Demo ----

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['warn', 'error'] },
  );

  await app.listen(3000, '0.0.0.0');
  console.log('Guards Example running on http://localhost:3000\n');

  const baseUrl = 'http://localhost:3000';

  async function test(label: string, url: string, headers: Record<string, string> = {}) {
    console.log(`--- ${label} ---`);
    const res = await fetch(`${baseUrl}${url}`, { headers });
    const data = await res.json();
    console.log(`GET ${url} -> ${res.status}`, JSON.stringify(data));
    console.log('');
  }

  // No API key — 401
  await test('No API key', '/public-data');

  // Valid API key — 200
  await test('Valid API key', '/public-data', { 'x-api-key': VALID_API_KEY });

  // Admin route without role — 403
  await test('Admin route, no role', '/admin-data', { 'x-api-key': VALID_API_KEY });

  // Admin route with wrong role — 403
  await test('Admin route, user role', '/admin-data', {
    'x-api-key': VALID_API_KEY,
    'x-user-role': 'user',
  });

  // Admin route with admin role — 200
  await test('Admin route, admin role', '/admin-data', {
    'x-api-key': VALID_API_KEY,
    'x-user-role': 'admin',
  });

  // Editor route with editor role — 200
  await test('Editor route, editor role', '/editor-data', {
    'x-api-key': VALID_API_KEY,
    'x-user-role': 'editor',
  });

  await app.close();
  console.log('Done!');
}

bootstrap();
