import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: { id: string; email?: string; role?: string };
  }
}

// Verifies the JWT issued by santa-api (shared JWT_SECRET) and populates
// request.user. Use as a route preHandler: { preHandler: [fastify.authenticate] }.
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const header = request.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
      if (!token) {
        return reply
          .code(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
      }
      try {
        const payload = jwt.verify(token, fastify.config.jwtSecret) as JwtPayload;
        request.user = { id: payload.sub, email: payload.email, role: payload.role };
      } catch {
        return reply
          .code(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
      }
    },
  );
}

export default fp(authPlugin, { name: 'auth', dependencies: ['config'] });
