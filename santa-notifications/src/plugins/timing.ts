import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    startTime: number;
  }
}

async function timingPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('startTime', 0);

  fastify.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onSend', async (request, reply) => {
    const elapsed = Date.now() - request.startTime;
    reply.header('X-Response-Time', `${elapsed}ms`);
  });
}

export default fp(timingPlugin, { name: 'timing' });
