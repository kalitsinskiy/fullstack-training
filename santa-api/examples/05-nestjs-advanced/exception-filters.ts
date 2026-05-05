export {};
// ============================================
// EXCEPTION FILTERS Example
// ============================================
// Run: npx ts-node src/04-backend/lessons/05-nestjs-advanced/examples/exception-filters.ts
//
// Demonstrates:
// 1. Default NestJS exception handling
// 2. Custom exception filter that formats all errors consistently
// 3. Filter for a specific custom exception

import 'reflect-metadata';
import {
  Controller, Get, Module, UseFilters,
  HttpException, HttpStatus, NotFoundException,
  ExceptionFilter, Catch, ArgumentsHost,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyReply } from 'fastify';

// ============================================
// Custom Exception
// ============================================

class BusinessLogicException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super({ code, message }, status);
  }
}

// ============================================
// Filter 1: Catch-all exception filter
// ============================================
// Formats ALL exceptions into a consistent JSON structure.

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof BusinessLogicException) {
      status = exception.getStatus();
      message = (exception.getResponse() as { message: string }).message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'string' ? response : (response as { message: string }).message;
      code = `HTTP_${status}`;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.log(`[ExceptionFilter] ${code}: ${message} (${status})`);

    reply.status(status).send({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// Controller
// ============================================

@Controller('demo')
@UseFilters(AllExceptionsFilter)
class DemoController {
  // Returns 200 normally
  @Get('ok')
  getOk() {
    return { message: 'Everything is fine' };
  }

  // Throws built-in NotFoundException (404)
  @Get('not-found')
  getNotFound() {
    throw new NotFoundException('The resource you requested does not exist');
  }

  // Throws a custom business exception (422)
  @Get('business-error')
  getBusinessError() {
    throw new BusinessLogicException(
      'ROOM_FULL',
      'Cannot join room — maximum capacity reached',
    );
  }

  // Throws a generic Error (becomes 500)
  @Get('crash')
  getCrash() {
    throw new Error('Something unexpected happened');
  }

  // Throws HttpException with custom status
  @Get('forbidden')
  getForbidden() {
    throw new HttpException('You are not allowed here', HttpStatus.FORBIDDEN);
  }
}

@Module({ controllers: [DemoController] })
class AppModule {}

// ---- Bootstrap & Demo ----

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['warn', 'error'] },
  );

  await app.listen(3000, '0.0.0.0');
  console.log('Exception Filters Example running on http://localhost:3000\n');

  const baseUrl = 'http://localhost:3000';

  async function test(label: string, url: string) {
    console.log(`--- ${label} ---`);
    const res = await fetch(`${baseUrl}${url}`);
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  }

  await test('OK response', '/demo/ok');
  await test('Not Found (404)', '/demo/not-found');
  await test('Business Error (422)', '/demo/business-error');
  await test('Unexpected crash (500)', '/demo/crash');
  await test('Forbidden (403)', '/demo/forbidden');

  await app.close();
  console.log('Done! All errors were caught and formatted consistently by the filter.');
}

bootstrap();
