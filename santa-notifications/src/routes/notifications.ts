import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { NotFoundError } from '../errors';
import { NotificationDocument, NotificationModel } from '../models/notification';

interface NotificationView {
  id: string;
  userId: string;
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
    userId: doc.userId?.toString() ?? '',
    type: doc.type,
    message: doc.message,
    roomId: doc.roomId,
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
  };
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  // List notifications for the authenticated user (IDOR-safe: userId from JWT)
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
      const { sub: userId } = request.user;
      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };

      const userObjectId = new Types.ObjectId(userId);
      const skip = (Number(page) - 1) * Number(limit);

      const [notifications, total, unreadCount] = await Promise.all([
        NotificationModel.find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .exec(),
        NotificationModel.countDocuments({ userId: userObjectId }),
        NotificationModel.countDocuments({ userId: userObjectId, read: false }),
      ]);

      return {
        data: notifications.map(toView),
        total,
        unreadCount,
        page: Number(page),
        limit: Number(limit),
      };
    }
  );

  // Mark a notification as read (scoped to authenticated user)
  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
      schema: { params: idParamsSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user;

      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { read: true },
        { new: true }
      ).exec();

      if (!notification) {
        return reply.status(404).send({ message: 'Notification not found' });
      }

      request.log.info({ notificationId: id, read: true }, 'Notification marked as read');
      return toView(notification);
    }
  );

  // Mark all notifications as read for the authenticated user
  fastify.patch('/read-all', { preHandler: [fastify.authenticate] }, async (request) => {
    const { sub: userId } = request.user;
    await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true }
    ).exec();
    return { success: true };
  });

  // Get single notification (scoped to authenticated user)
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { params: idParamsSchema },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user;

      const notification = await NotificationModel.findOne({
        _id: id,
        userId: new Types.ObjectId(userId),
      }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      return toView(notification);
    }
  );

  // Delete a notification (scoped to authenticated user)
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { params: idParamsSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user;

      const notification = await NotificationModel.findOneAndDelete({
        _id: id,
        userId: new Types.ObjectId(userId),
      }).exec();

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      request.log.info({ notificationId: id }, 'Notification deleted');
      reply.code(204).send();
    }
  );
}
