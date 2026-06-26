import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import ajvFormats from 'ajv-formats';

import configPlugin from './plugins/config';
import authPlugin from './plugins/auth';
import redisPlugin from './plugins/redis';
import { AppError, ValidationError } from './errors';
import timingPlugin from './plugins/timing';
import healthRoutes from './routes/health';
import notificationRoutes from './routes/notifications';
import messageRoutes from './routes/messages';
import usersRoutes from './routes/users';

export function buildApp() {
  const app = Fastify({
    logger: {
      level:
        process.env.LOG_LEVEL ??
        (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
      transport:
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    ajv: {
      plugins: [ajvFormats as never],
    },
  });

  // CORS so the browser SPA (Vite :5173) can read notifications directly.
  app.register(cors, {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  app.register(configPlugin);
  app.register(authPlugin);
  app.register(redisPlugin);
  app.register(timingPlugin);
  app.register(healthRoutes);
  app.register(usersRoutes);
  app.register(notificationRoutes, { prefix: '/api/notifications' });
  app.register(messageRoutes, { prefix: '/api/messages' });

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
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return app;
}
