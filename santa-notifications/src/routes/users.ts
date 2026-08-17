import { FastifyInstance } from 'fastify';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/online', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
    const onlineUsers = await fastify.redis.smembers('online:users');
    return reply.send(onlineUsers);
  });
}
