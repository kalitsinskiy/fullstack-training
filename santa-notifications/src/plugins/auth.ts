import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyHs256, type JwtPayload } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: JwtPayload;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply
          .status(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
      }

      try {
        request.user = verifyHs256(authHeader.slice(7), fastify.config.jwtSecret);
      } catch {
        return reply
          .status(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
      }
    },
  );
}

export default fp(authPlugin, { name: 'auth', dependencies: ['config'] });
