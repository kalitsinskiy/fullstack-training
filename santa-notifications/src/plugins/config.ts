import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
  mongoUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  santaApiUrl: string;
  serviceKey: string;
  corsOrigin: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

async function configPlugin(fastify: FastifyInstance) {
  const port = Number(process.env.PORT ?? 3002);
  const env = process.env.NODE_ENV ?? 'development';
  const mongoUrl = process.env.MONGO_URL ?? '';
  const redisUrl = process.env.REDIS_URL ?? '';
  const rabbitmqUrl = process.env.RABBITMQ_URL ?? '';
  const jwtSecret = process.env.JWT_SECRET ?? '';
  const santaApiUrl = process.env.SANTA_API_URL ?? 'http://localhost:3001';
  const serviceKey = process.env.SERVICE_API_KEY ?? '';
  const corsOrigin = process.env.CORS_ORIGIN ?? '';

  const missing: string[] = [];

  if (!mongoUrl) missing.push('MONGO_URL');
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!serviceKey) missing.push('SERVICE_API_KEY');
  if (!santaApiUrl) missing.push('SANTA_API_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  fastify.decorate('config', {
    port,
    env,
    mongoUrl,
    redisUrl,
    rabbitmqUrl,
    jwtSecret,
    santaApiUrl,
    serviceKey,
    corsOrigin,
  });
}

export default fp(configPlugin, { name: 'config' });
