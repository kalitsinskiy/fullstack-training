import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../errors';
import { NotificationDocument, NotificationModel, NotificationType } from '../models/notification';

interface Notification {
  id: string;
  userId: string | null;
  type: string;
  message: string;
  payload?: unknown;
  read: boolean;
  createdAt: string;
}

const notificationTypeValues = ['room_invite', 'assignment', 'wishlist_update', 'system'] as const;

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
};

const objectIdSchema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

function toNotification(notification: NotificationDocument): Notification {
  return {
    id: notification._id.toString(),
    userId: notification.userId?.toString() ?? null,
    type: notification.type,
    message: notification.message,
    payload: notification.payload,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  // Service-to-service guard: notifications are created by the event consumer,
  // not by end users. Require the shared service key so a client can't forge a
  // notification for an arbitrary user.
  const requireServiceKey = async (
    request: Parameters<typeof fastify.authenticate>[0],
    reply: Parameters<typeof fastify.authenticate>[1],
  ) => {
    const key = request.headers['x-service-key'];
    if (!key || key !== fastify.config.serviceApiKey) {
      return reply
        .code(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid service key' } });
    }
  };

  // Authenticated: returns the CALLER's notifications (derived from the JWT, not
  // a query param) + an unread count for the header badge. Fixes the IDOR.
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user!.id;
    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ userId }).sort({ createdAt: -1 }).exec(),
      NotificationModel.countDocuments({ userId, read: false }),
    ]);
    return {
      data: notifications.map((n) => toNotification(n)),
      unreadCount,
    };
  });

  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: idParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      // Ownership: only the recipient can read their own notification (no IDOR).
      const notification = await NotificationModel.findOne({
        _id: id,
        userId: request.user!.id,
      }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      return toNotification(notification);
    }
  );

  fastify.post(
    '/',
    {
      preHandler: [requireServiceKey],
      schema: {
        body: {
          type: 'object',
          required: ['userId', 'type', 'message'],
          properties: {
            userId: objectIdSchema,
            type: { type: 'string', enum: [...notificationTypeValues] },
            payload: {},
            message: { type: 'string', minLength: 1, maxLength: 500 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { userId, type, payload, message } = request.body as {
        userId: string;
        type: NotificationType;
        payload?: unknown;
        message: string;
      };

      const createdNotification = await NotificationModel.create({
        userId,
        type,
        payload,
        message,
      });

      request.log.info(
        { notificationId: createdNotification._id.toString(), userId, type },
        'Notification created'
      );
      reply.code(201);
      return toNotification(createdNotification);
    }
  );

  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: idParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      // Ownership: scope to the caller so you can't mark someone else's as read.
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id, userId: request.user!.id },
        { read: true },
        { new: true }
      ).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info(
        { notificationId: notification._id.toString(), read: true },
        'Notification marked as read'
      );
      return toNotification(notification);
    }
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: idParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      // Ownership: only the recipient can delete their own notification (no IDOR).
      const notification = await NotificationModel.findOneAndDelete({
        _id: id,
        userId: request.user!.id,
      }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info({ notificationId: notification._id.toString() }, 'Notification deleted');
      reply.code(204).send();
    }
  );
}
