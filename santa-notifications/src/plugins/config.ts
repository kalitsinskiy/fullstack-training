import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
  mongoUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
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

  const missing: string[] = [];

  if (!mongoUrl) missing.push('MONGO_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required env varialbles: ${missing.join(', ')}`);
  }

  fastify.decorate('config', { port, env, mongoUrl, redisUrl, rabbitmqUrl });
}

export default fp(configPlugin, { name: 'config' });
