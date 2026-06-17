import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.getHttpExceptionMessage(exception)
        : 'Internal server error';

    response.status(statusCode).send({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
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
