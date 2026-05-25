import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { NotFoundError } from '../errors';
import { NotificationModel } from '../models/notification';
import { paginate } from '../pagination';

type NotificationType = 'room_invite' | 'assignment' | 'wishlist_update' | 'system';

type NotificationDTO = {
  userId: string;
  type: NotificationType;
  message: string;
  payload?: unknown;
};

const OBJECT_ID_PATTERN = '^[a-fA-F0-9]{24}$';

async function notificationsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.log.info({ prefix: '/api/notifications' }, 'Registering notifications routes');

  const idParamSchema = {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: OBJECT_ID_PATTERN },
        },
        additionalProperties: false,
      },
    },
  };

  fastify.get<{
    Querystring: { userId?: string; page?: number; limit?: number };
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              pattern: OBJECT_ID_PATTERN,
            },
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const { userId, page, limit } = request.query;
      const query: { userId?: string } = {};

      if (userId !== undefined) {
        query.userId = userId;
      }

      return paginate(NotificationModel, query, { page, limit }, { createdAt: -1 });
    }
  );

  fastify.log.info({ route: '/api/notifications/', method: 'GET' }, 'Route registered');

  fastify.get<{
    Params: { id: string };
  }>('/:id', idParamSchema, async (request, _reply) => {
    const { id } = request.params;
    const notification = await NotificationModel.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    return notification;
  });

  fastify.log.info({ route: '/api/notifications/:id', method: 'GET' }, 'Route registered');

  fastify.post<{
    Body: NotificationDTO;
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userId', 'type', 'message'],
          properties: {
            userId: {
              type: 'string',
              pattern: OBJECT_ID_PATTERN,
            },
            type: {
              type: 'string',
              enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
            },
            message: { type: 'string', minLength: 1, maxLength: 500 },
            payload: {},
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const data = request.body;
      const notification = await NotificationModel.create({
        userId: data.userId,
        type: data.type,
        payload: data.payload,
        message: data.message,
      });

      reply.code(201);
      return notification;
    }
  );

  fastify.log.info({ route: '/api/notifications/', method: 'POST' }, 'Route registered');

  fastify.patch<{
    Params: { id: string };
  }>('/:id/read', idParamSchema, async (request, _reply) => {
    const { id } = request.params;
    const updated = await NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true });

    if (updated) {
      return updated;
    }

    throw new NotFoundError('Notification', id);
  });

  fastify.log.info({ route: '/api/notifications/:id/read', method: 'PATCH' }, 'Route registered');

  fastify.delete<{
    Params: { id: string };
  }>('/:id', idParamSchema, async (request, reply) => {
    const { id } = request.params;
    const deleted = await NotificationModel.findByIdAndDelete(id);

    if (deleted) {
      reply.code(204);
      return;
    } else {
      throw new NotFoundError('Notification', id);
    }
  });

  fastify.log.info({ route: '/api/notifications/:id', method: 'DELETE' }, 'Route registered');
}

export { notificationsRoutes };
