import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
  mongoUrl: string;
  redisUrl: string;
  rabbitUrl: string;
  jwtSecret: string;
  santaApiUrl: string;
  serviceApiKey: string;
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
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const rabbitUrl =
    process.env.RABBITMQ_URL ?? 'amqp://santa:santa123@localhost:5672';
  // Same secret as santa-api — we verify the JWT it issued.
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
  const santaApiUrl = process.env.SANTA_API_URL ?? 'http://localhost:3001';
  const serviceApiKey =
    process.env.SERVICE_API_KEY ?? 'dev-service-key-change-in-production';

  // Fail fast: list every missing required variable, then throw.
  const missing: string[] = [];
  if (!mongoUrl) missing.push('MONGO_URL');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  fastify.decorate('config', {
    port,
    env,
    mongoUrl,
    redisUrl,
    rabbitUrl,
    jwtSecret,
    santaApiUrl,
    serviceApiKey,
  });
}

export default fp(configPlugin, { name: 'config' });
