import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(fastify: FastifyInstance) {
  const client = new Redis(fastify.config.redisUrl);

  client.on('connect', () => fastify.log.info('Connected to Redis'));
  client.on('error', (err) => fastify.log.error({ err }, 'Redis error'));

  fastify.decorate('redis', client);

  fastify.addHook('onClose', async () => {
    await client.quit();
  });
}

export default fp(redisPlugin, { name: 'redis', dependencies: ['config'] });
