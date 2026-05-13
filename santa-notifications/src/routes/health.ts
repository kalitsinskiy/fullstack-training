import { FastifyInstance, FastifyPluginOptions } from 'fastify';

async function healthRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.log.info({ route: '/health', method: 'GET' }, 'Registering health route');

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  fastify.log.debug('Health routes loaded');
}

export { healthRoutes };
