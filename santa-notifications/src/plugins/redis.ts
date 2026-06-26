import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

// Connects ioredis using fastify.config.redisUrl and decorates `fastify.redis`.
// Used for presence (online:users set) now, and more in later lessons.
async function redisPlugin(fastify: FastifyInstance) {
  const client = new Redis(fastify.config.redisUrl);
  client.on('connect', () => fastify.log.info('Redis connected'));
  client.on('error', (err) => fastify.log.error({ err }, 'Redis error'));

  fastify.decorate('redis', client);
  fastify.addHook('onClose', async () => {
    await client.quit();
  });
}

export default fp(redisPlugin, { name: 'redis', dependencies: ['config'] });
