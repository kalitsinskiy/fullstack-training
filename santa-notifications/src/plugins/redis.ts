import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  const client = new Redis(fastify.config.redisUrl, { maxRetriesPerRequest: 3 });

  client.on('error', (err) => fastify.log.error({ err }, 'Redis error'));

  fastify.decorate('redis', client);
  fastify.addHook('onClose', async () => {
    await client.quit();
  });
}

export default fp(redisPlugin, { name: 'redis', dependencies: ['config'] });
