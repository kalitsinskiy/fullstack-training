import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../errors';
import { NotificationDocument, NotificationModel } from '../models/notification';

interface Notification {
  id: string;
  userId: string | null;
  roomId: string | null;
  type: string;
  message: string;
  payload?: unknown;
  read: boolean;
  createdAt: string;
}

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
};

function toNotification(notification: NotificationDocument): Notification {
  return {
    id: notification._id.toString(),
    userId: notification.userId?.toString() ?? null,
    roomId: notification.roomId?.toString() ?? null,
    type: notification.type,
    message: notification.message,
    payload: notification.payload,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * All routes require a valid JWT and are scoped to `request.user.sub`, so a
 * caller can only ever read or mutate their own notifications. `userId` is
 * never read from the query or body — that closes the IDOR these routes had
 * during the kickoff scaffolding.
 */
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
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const userId = request.user.sub;
      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
      const skip = (page - 1) * limit;

      const [data, total, unreadCount] = await Promise.all([
        NotificationModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        NotificationModel.countDocuments({ userId }),
        NotificationModel.countDocuments({ userId, read: false }),
      ]);

      return { data: data.map(toNotification), total, unreadCount, page, limit };
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
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id, userId: request.user.sub },
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
}
