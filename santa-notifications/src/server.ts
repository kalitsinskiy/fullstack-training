import Fastify from 'fastify';

export const server = Fastify({ logger: false });

server.get('/health', async () => {
  return { status: 'ok' };
});

if (require.main === module) {
  server.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log('Server listening on port 3002');
  });
}
