import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { createPresenceStore, PresenceStore } from '../presence/store';

declare module 'fastify' {
  interface FastifyInstance {
    presence: PresenceStore;
  }
}

async function presencePlugin(fastify: FastifyInstance) {
  const store = createPresenceStore(fastify.config.redisUrl, fastify.config.env, fastify.log);

  fastify.decorate('presence', store);

  fastify.addHook('onClose', async () => {
    await store.close();
  });
}

export default fp(presencePlugin, { name: 'presence', dependencies: ['config'] });
