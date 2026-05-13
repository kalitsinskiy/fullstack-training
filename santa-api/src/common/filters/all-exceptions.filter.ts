import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type FastifyReply } from 'fastify';

interface ErrorEnvelope {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();

    const { statusCode, message } = this.toEnvelope(exception);

    if (statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorEnvelope = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };

    reply.status(statusCode).send(body);
  }

  private toEnvelope(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode: status, message: response };
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        return {
          statusCode: status,
          message: (response as { message: string | string[] }).message,
        };
      }

      return { statusCode: status, message: exception.message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
