import type { FastifyInstance } from 'fastify';
import { listOnline } from '../online-users';

export default async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/users/online',
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: { type: 'array', items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
        },
      },
    },
    async () => listOnline(fastify.redis)
  );
}
