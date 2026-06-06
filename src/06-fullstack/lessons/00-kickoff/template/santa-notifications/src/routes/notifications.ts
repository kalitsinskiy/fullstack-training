import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { NotFoundError } from '../errors';
import { NotificationDocument, NotificationModel, NotificationType } from '../models/notification';

interface Notification {
  id: string;
  userId: string;
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
    userId: notification.userId.toString(),
    type: notification.type,
    message: notification.message,
    payload: notification.payload,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            userId: objectIdSchema,
          },
        },
      },
    },
    async (request) => {
      const { userId } = request.query as { userId?: string };
      const query = userId ? { userId } : {};
      const notifications = await NotificationModel.find(query).sort({ createdAt: -1 }).exec();

      return notifications.map((notification) => toNotification(notification));
    }
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const notification = await NotificationModel.findById(id).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      return toNotification(notification);
    }
  );

  fastify.post(
    '/',
    {
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
      schema: {
        params: idParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const notification = await NotificationModel.findByIdAndUpdate(
        id,
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
      schema: {
        params: idParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const notification = await NotificationModel.findByIdAndDelete(id).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info({ notificationId: notification._id.toString() }, 'Notification deleted');
      reply.code(204).send();
    }
  );
}
