import type { FastifyInstance } from 'fastify';
import { listOnline } from '../online-users';

export default async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/users/online', async () => listOnline(fastify.redis));
}
