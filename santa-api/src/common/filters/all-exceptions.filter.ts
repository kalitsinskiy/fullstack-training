import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<FastifyReply>();
    const request = http.getRequest<FastifyRequest>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.getHttpExceptionMessage(exception)
        : 'Internal server error';

    // Server-side failures (any 5xx — always the case for non-HttpException
    // errors) must not be swallowed: capture the stack so a production 500 has a
    // trace. 4xx are client errors and aren't logged here.
    if (statusCode >= 500) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).send({
      success: false,
      error: {
        code: this.statusToCode(statusCode),
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }

  private getHttpExceptionMessage(exception: HttpException): string | string[] {
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return payload;
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload
    ) {
      return payload.message as string | string[];
    }

    return exception.message;
  }
}
