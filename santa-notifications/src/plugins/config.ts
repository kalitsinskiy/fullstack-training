import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
  mongoUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  santaApiUrl: string;
  serviceApiKey: string;
  jwtSecret: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

const TEST_SERVICE_API_KEY = 'test-service-key';
const TEST_JWT_SECRET = 'test-jwt-secret';

async function configPlugin(fastify: FastifyInstance) {
  const port = Number(process.env.PORT ?? 3002);
  const env = process.env.NODE_ENV ?? 'development';
  const mongoUrl = process.env.MONGO_URL ?? '';
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const rabbitmqUrl = process.env.RABBITMQ_URL ?? 'amqp://santa:santa123@localhost:5672';
  const santaApiUrl = process.env.SANTA_API_URL ?? 'http://localhost:3001';
  const serviceApiKey = process.env.SERVICE_API_KEY ?? '';
  const jwtSecret = process.env.JWT_SECRET ?? '';

  const missing: string[] = [];
  if (!mongoUrl) missing.push('MONGO_URL');
  if (env !== 'test') {
    if (!serviceApiKey) missing.push('SERVICE_API_KEY');
    if (!jwtSecret) missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  fastify.decorate('config', {
    port,
    env,
    mongoUrl,
    redisUrl,
    rabbitmqUrl,
    santaApiUrl,
    serviceApiKey: serviceApiKey || TEST_SERVICE_API_KEY,
    jwtSecret: jwtSecret || TEST_JWT_SECRET,
  });
}

export default fp(configPlugin, { name: 'config' });
