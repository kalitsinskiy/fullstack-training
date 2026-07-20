import { FastifyInstance } from 'fastify';

const ONLINE_USERS_KEY = 'online:users';

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/online', async () => {
    const members = await fastify.redis.smembers(ONLINE_USERS_KEY);
    return members;
  });
}

/*
//FUTURE REFERENCE:

// When a user connects
await redis.sadd('online:users', userId);

// When a user disconnects
await redis.srem('online:users', userId);

// Check if a user is online
const isOnline = await redis.sismember('online:users', userId);

// Get all online users
const onlineUsers = await redis.smembers('online:users');

// Count online users
const count = await redis.scard('online:users');
*/
