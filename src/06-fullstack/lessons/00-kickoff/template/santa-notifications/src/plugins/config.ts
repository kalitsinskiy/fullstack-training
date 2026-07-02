import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface AppConfig {
  port: number;
  env: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

async function configPlugin(fastify: FastifyInstance) {
  const port = Number(process.env.PORT ?? 3002);
  const env = process.env.NODE_ENV ?? 'development';

  fastify.decorate('config', { port, env });
}

export default fp(configPlugin, { name: 'config' });
