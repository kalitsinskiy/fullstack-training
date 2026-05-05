export {};
// ============================================
// INTERCEPTORS Example
// ============================================
// Run: npx ts-node src/04-backend/lessons/05-nestjs-advanced/examples/interceptors.ts
//
// Demonstrates three interceptors:
// 1. LoggingInterceptor — logs request method, URL, and duration
// 2. TransformInterceptor — wraps all responses in a standard envelope
// 3. TimeoutInterceptor — aborts slow requests after a timeout

import 'reflect-metadata';
import {
  Controller, Get, Module, Injectable, UseInterceptors,
  NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Observable, tap, map, timeout, catchError, throwError, TimeoutError } from 'rxjs';

// ============================================
// Interceptor 1: Logging
// ============================================
// Logs the HTTP method, URL, and response time for every request.

@Injectable()
class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    // next.handle() calls the route handler and returns an Observable
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`[LOG] ${method} ${url} — ${duration}ms`);
      }),
    );
  }
}

// ============================================
// Interceptor 2: Transform Response
// ============================================
// Wraps every response in { success: true, data: ..., timestamp: ... }

@Injectable()
class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// ============================================
// Interceptor 3: Timeout
// ============================================
// Aborts the request if the handler takes longer than 3 seconds.

@Injectable()
class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(3000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timed out'));
        }
        return throwError(() => err);
      }),
    );
  }
}

// ============================================
// Controller
// ============================================

@Controller()
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
class AppController {
  @Get('fast')
  getFast() {
    return { message: 'This is fast', items: [1, 2, 3] };
  }

  @Get('slow')
  @UseInterceptors(TimeoutInterceptor) // Only this route has timeout
  async getSlow() {
    // Simulate a slow operation (2 seconds — within timeout)
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { message: 'This was slow but made it' };
  }

  @Get('too-slow')
  @UseInterceptors(TimeoutInterceptor)
  async getTooSlow() {
    // Simulate a very slow operation (5 seconds — exceeds 3s timeout)
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { message: 'You will never see this' };
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
  console.log('Interceptors Example running on http://localhost:3000\n');

  const baseUrl = 'http://localhost:3000';

  async function test(label: string, url: string) {
    console.log(`--- ${label} ---`);
    const res = await fetch(`${baseUrl}${url}`);
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  }

  // Fast response — transformed into envelope
  await test('Fast endpoint', '/fast');

  // Slow but within timeout
  await test('Slow endpoint (2s)', '/slow');

  // Exceeds timeout — returns 408
  await test('Too slow endpoint (5s, times out at 3s)', '/too-slow');

  await app.close();
  console.log('Done!');
}

bootstrap();
