import { FastifyInstance } from 'fastify';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/users/online',
    {
      preHandler: [fastify.authenticate],
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
      preHandler: [fastify.authenticate],
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
