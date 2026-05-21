import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import healthRoutes from '../routes/health';
import configPlugin from '../plugins/config';
import timingPlugin from '../plugins/timing';
import notificationRoutes from '../routes/notifications';
import { AppError, ValidationError } from './errors';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            }
          : undefined,
    },
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error, code: error.code }, error.message);
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && { details: error.details }),
        },
      });
    }

    if (error.validation) {
      request.log.warn({ err: error }, 'Validation failed');
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        },
      });
    }

    request.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: `Route ${request.method} ${request.url} not found`,
    });
  });

  await app.register(configPlugin);
  await app.register(timingPlugin);
  await app.register(healthRoutes);
  await app.register(notificationRoutes, { prefix: '/api/notifications' });

  return app;
}
