/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// CUSTOM GUARD Exercise
// ============================================
// Run from santa-api/:  npx ts-node exercises/05-nestjs-advanced/custom-guard.ts
//
// Create a RolesGuard that checks user roles from a request header.
// Use a custom @Roles() decorator to specify required roles per route.

import 'reflect-metadata';
import {
  Controller, Get, Module, Injectable, UseGuards, SetMetadata,
  CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector, NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// ---- Custom Decorator ----

// TODO 1: Create a Roles decorator
// - Use SetMetadata to store an array of role strings under the key 'roles'
// - Usage: @Roles('admin', 'moderator')
const ROLES_KEY = 'roles';

// ---- Guard ----

// TODO 2: Create a RolesGuard that implements CanActivate
// - Inject Reflector via constructor
// - In canActivate():
//   a) Use this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) to get required roles
//   b) If no roles are set, return true (no restriction)
//   c) Get the user's role from the request header 'x-user-role'
//   d) If the user's role is not in the required roles, throw ForbiddenException
//      with a message like "Access denied. Required roles: admin, moderator"
//   e) Return true if authorized

// ---- Controller ----

// TODO 3: Create a DashboardController with prefix 'dashboard'
// - Apply RolesGuard to the entire controller with @UseGuards(RolesGuard)
// - Add these routes:
//
//   GET /dashboard/stats
//   @Roles('admin', 'moderator', 'viewer')
//   -> return { views: 1000, users: 50 }
//
//   GET /dashboard/settings
//   @Roles('admin')
//   -> return { theme: 'dark', notifications: true }
//
//   GET /dashboard/public
//   (no @Roles decorator — should be accessible to everyone)
//   -> return { message: 'Public dashboard info' }

// ---- Module & Bootstrap ----

// TODO 4: Create AppModule with the controller and RolesGuard as provider
// Bootstrap with FastifyAdapter on port 3000.
// Test with:
//   curl http://localhost:3000/dashboard/public                                    # 200
//   curl -H "x-user-role: viewer" http://localhost:3000/dashboard/stats            # 200
//   curl -H "x-user-role: viewer" http://localhost:3000/dashboard/settings         # 403
//   curl -H "x-user-role: admin" http://localhost:3000/dashboard/settings          # 200

async function bootstrap() {
  // Your bootstrap code here
}

bootstrap();
