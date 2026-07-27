import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import ajvFormats from 'ajv-formats';

import configPlugin from './plugins/config';
import authPlugin from './plugins/auth';
import { AppError, ValidationError } from './errors';
import timingPlugin from './plugins/timing';
import consumerPlugin from './plugins/consumer';
import presencePlugin from './plugins/presence';
import publisherPlugin from './plugins/publisher';
import santaApiPlugin from './plugins/santa-api';
import socketPlugin from './plugins/socket';
import healthRoutes from './routes/health';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import type { SantaApi } from './services/santa-api-client';

export interface BuildAppOptions {
  /** Swap in a fake santa-api client — used by the component tests. */
  santaApi?: SantaApi;
}

export function buildApp(options: BuildAppOptions = {}) {
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
  app.register(santaApiPlugin, { santaApi: options.santaApi });
  app.register(presencePlugin);
  app.register(socketPlugin);
  app.register(publisherPlugin);
  app.register(consumerPlugin);
  app.register(timingPlugin);
  app.register(healthRoutes);
  app.register(userRoutes);
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
