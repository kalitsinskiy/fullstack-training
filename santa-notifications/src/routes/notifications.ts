import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../errors';
import { currentUser } from '../plugins/auth';
import {
  NotificationModel,
  NotificationType,
  toNotificationDto as toNotification,
} from '../models/notification';

const notificationTypeValues = ['room_invite', 'assignment', 'wishlist_update', 'system'] as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
};

const objectIdSchema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
            unreadOnly: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request) => {
      const { id: userId } = currentUser(request);
      const {
        page = 1,
        limit = DEFAULT_LIMIT,
        unreadOnly = false,
      } = request.query as { page?: number; limit?: number; unreadOnly?: boolean };

      const filter = { userId, ...(unreadOnly ? { read: false } : {}) };
      const skip = (page - 1) * limit;

      const [notifications, unreadCount] = await Promise.all([
        NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        NotificationModel.countDocuments({ userId, read: false }).exec(),
      ]);

      return {
        data: notifications.map((notification) => toNotification(notification)),
        unreadCount,
      };
    }
  );

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
      const { id: userId } = currentUser(request);
      const notification = await NotificationModel.findOne({ _id: id, userId }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      return toNotification(notification);
    }
  );

  fastify.post(
    '/',
    {
      preHandler: [fastify.requireServiceKey],
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
      const { id: userId } = currentUser(request);
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id, userId },
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
      const { id: userId } = currentUser(request);
      const notification = await NotificationModel.findOneAndDelete({ _id: id, userId }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info({ notificationId: notification._id.toString() }, 'Notification deleted');
      reply.code(204).send();
    }
  );
}
