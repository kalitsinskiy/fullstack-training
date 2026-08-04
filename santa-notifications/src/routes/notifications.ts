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
 * ⚠️ SECURITY (intentional, until Lesson 07): these routes are NOT authenticated
 * and trust the `userId` from the query/body — a classic IDOR (anyone can read,
 * mark-read, or delete another user's notifications by id, or list them via
 * `?userId=`). This is deliberate kickoff scaffolding. Lesson 07 adds a JWT
 * `fastify.authenticate` preHandler and scopes every query to `request.user`,
 * which closes the IDOR. DO NOT deploy this service as-is (see Lesson 11).
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
