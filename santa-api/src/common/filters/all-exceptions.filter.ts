import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { PinoLogger } from 'nestjs-pino';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<FastifyReply>();
    const request = http.getRequest<{ method: string; url: string }>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.getHttpExceptionMessage(exception)
        : 'Internal server error';

    // Clients still get the generic message; the cause is logged server-side.
    // 5xx is an operator problem (error); 4xx is a caller problem (debug).
    const context = { method: request.method, url: request.url, statusCode };
    const SERVER_ERROR_MIN: number = HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= SERVER_ERROR_MIN) {
      this.logger.error({ ...context, err: exception }, 'Unhandled exception');
    } else {
      this.logger.debug(context, 'Request rejected');
    }

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
