import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Notification, NotificationDTO } from '../models/notification';
import { NotFoundError } from '../errors';

async function notificationsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const { db } = fastify;

  fastify.log.info({ prefix: '/api/notifications' }, 'Registering notifications routes');

  const idParamSchema = {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^\\d+$' },
        },
        additionalProperties: false,
      },
    },
  };

  fastify.get<{
    Querystring: { userId?: string };
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            userId: { type: 'string', pattern: '^\\d+$' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const { userId } = request.query;
      if (userId) {
        const filteredNotifications = db.notifications.filter((n) => n.userId === userId);
        return filteredNotifications;
      }
      return db.notifications;
    }
  );

  fastify.log.info({ route: '/api/notifications/', method: 'GET' }, 'Route registered');

  fastify.get<{
    Params: { id: string };
  }>('/:id', idParamSchema, async (request, _reply) => {
    const { id } = request.params;
    const idNum = parseInt(id, 10);
    const notification = db.notifications.find((n) => n.id === idNum);

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
            userId: { type: 'string', pattern: '^\\d+$' },
            type: {
              type: 'string',
              enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
            },
            message: { type: 'string', minLength: 1, maxLength: 500 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const data = request.body;
      const notification: Notification = {
        id: db.nextId++,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
        type: data.type,
        message: data.message,
      };

      db.notifications.push(notification);

      reply.code(201);
      return notification;
    }
  );

  fastify.log.info({ route: '/api/notifications/', method: 'POST' }, 'Route registered');

  fastify.patch<{
    Params: { id: string };
  }>('/:id/read', idParamSchema, async (request, _reply) => {
    const { id } = request.params;
    const idNum = parseInt(id, 10);
    const notificationIdx = db.notifications.findIndex((n) => n.id === idNum);

    if (notificationIdx !== -1) {
      db.notifications[notificationIdx].read = true;
      return db.notifications[notificationIdx];
    }

    throw new NotFoundError('Notification', id);
  });

  fastify.log.info({ route: '/api/notifications/:id/read', method: 'PATCH' }, 'Route registered');

  fastify.delete<{
    Params: { id: string };
  }>('/:id', idParamSchema, async (request, reply) => {
    const { id } = request.params;
    const idNum = parseInt(id, 10);
    const notificationIdx = db.notifications.findIndex((n) => n.id === idNum);

    if (notificationIdx !== -1) {
      db.notifications.splice(notificationIdx, 1);
      reply.code(204);
    } else {
      throw new NotFoundError('Notification', id);
    }
  });

  fastify.log.info({ route: '/api/notifications/:id', method: 'DELETE' }, 'Route registered');
}

export { notificationsRoutes };
