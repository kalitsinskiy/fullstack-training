import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
  mongoUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  serviceApiKey: string;
  santaApiUrl: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

async function configPlugin(fastify: FastifyInstance) {
  const port = Number(process.env.PORT ?? 3002);
  const env = process.env.NODE_ENV ?? 'development';
  const mongoUrl = process.env.MONGO_URL;
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  const jwtSecret = process.env.JWT_SECRET;
  const serviceApiKey = process.env.SERVICE_API_KEY;
  const santaApiUrl = process.env.SANTA_API_URL ?? 'http://localhost:3001';

  const missing: string[] = [];
  if (!mongoUrl) missing.push('MONGO_URL');
  if (!rabbitmqUrl) missing.push('RABBITMQ_URL');
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!serviceApiKey) missing.push('SERVICE_API_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  fastify.decorate('config', {
    port,
    env,
    mongoUrl: mongoUrl!,
    redisUrl,
    rabbitmqUrl: rabbitmqUrl!,
    jwtSecret: jwtSecret!,
    serviceApiKey: serviceApiKey!,
    santaApiUrl,
  });
}

export default fp(configPlugin, { name: 'config' });
