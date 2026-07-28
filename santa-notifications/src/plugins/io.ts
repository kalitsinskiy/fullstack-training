import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Server } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server | null;
  }
}

async function ioPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorate('io', null);
}

export default fp(ioPlugin, { name: 'io' });
