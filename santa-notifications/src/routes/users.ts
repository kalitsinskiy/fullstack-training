import { FastifyInstance } from 'fastify';

export const ONLINE_USERS_KEY = 'online:users';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Currently-connected users, tracked in a Redis set. The set is populated by
  // the WebSocket layer (Lesson 07): sadd on connect, srem on disconnect.
  fastify.get('/users/online', async () => {
    return fastify.redis.smembers(ONLINE_USERS_KEY);
  });
}
