import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../errors';
import { NotificationDocument, NotificationModel } from '../models/notification';

interface NotificationView {
  id: string;
  type: string;
  message: string;
  roomId?: string;
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

function toView(doc: NotificationDocument): NotificationView {
  return {
    id: doc._id.toString(),
    type: doc.type,
    message: doc.message,
    roomId: doc.roomId,
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
  };
}

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
      const skip = (Number(page) - 1) * Number(limit);

      const [notifications, total, unreadCount] = await Promise.all([
        NotificationModel.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean()
          .exec(),
        NotificationModel.countDocuments({ userId }),
        NotificationModel.countDocuments({ userId, read: false }),
      ]);

      return {
        data: notifications.map((n) => toView(n as unknown as NotificationDocument)),
        total,
        unreadCount,
        page: Number(page),
        limit: Number(limit),
      };
    },
  );

  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
      schema: { params: idParamsSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id, userId },
        { read: true },
        { new: true },
      ).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info({ notificationId: id }, 'Notification marked as read');
      return toView(notification);
    },
  );

  fastify.patch(
    '/read-all',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      await NotificationModel.updateMany({ userId, read: false }, { read: true }).exec();
      return { success: true };
    },
  );
}
