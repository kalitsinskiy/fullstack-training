import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

void (async () => {
  await server.listen({ port: 3002, host: '0.0.0.0' });
})();
