import { FastifyInstance } from 'fastify';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/users/online',
    {
      schema: {
        response: {
          200: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    async () => fastify.presence.listOnline()
  );

  fastify.get(
    '/users/online/count',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { count: { type: 'number' } },
          },
        },
      },
    },
    async () => ({ count: await fastify.presence.countOnline() })
  );
}
