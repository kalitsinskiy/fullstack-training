import { Types } from 'mongoose';
import { FastifyInstance } from 'fastify';
import { ForbiddenError, NotFoundError } from '../errors';
import { directionFor, mirrorThread, Thread } from '../messages/thread';
import { MessageDocument, MessageModel, Reaction, REACTIONS } from '../models/message';

const objectIdSchema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

function toChatMessage(doc: MessageDocument, me: string) {
  const direction = directionFor(doc.senderId.toString(), me);
  const iAmSender = direction === 'out';

  return {
    id: doc._id.toString(),
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
    direction,
    ...(iAmSender ? { read: doc.read } : {}),
    myReaction: (iAmSender ? doc.senderReaction : doc.recipientReaction) ?? null,
    theirReaction: (iAmSender ? doc.recipientReaction : doc.senderReaction) ?? null,
  };
}

async function conversation(roomId: string, me: string, other: string) {
  const [meId, otherId, rId] = [me, other, roomId].map((val) => new Types.ObjectId(val));
  const docs = await MessageModel.find({
    roomId: rId,
    $or: [
      { senderId: meId, recipientId: otherId },
      { senderId: otherId, recipientId: meId },
    ],
  })
    .sort({ createdAt: 1 })
    .exec();

  return docs.map((doc) => toChatMessage(doc, me));
}

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['roomId', 'to', 'text'],
          properties: {
            roomId: objectIdSchema,
            to: { type: 'string', enum: ['giftee', 'santa'] },
            text: { type: 'string', minLength: 1, maxLength: 500 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const me = request.user.sub;
      const { roomId, to, text } = request.body as { roomId: string; to: Thread; text: string };

      const relations = await fastify.santaApi.getRelations(roomId, me);
      const recipientId = to === 'giftee' ? relations.gifteeId : relations.santaId;

      if (!recipientId) {
        throw new ForbiddenError('You cannot send messages in this room yet');
      }

      const doc = await MessageModel.create({
        senderId: new Types.ObjectId(me),
        recipientId: new Types.ObjectId(recipientId),
        roomId: new Types.ObjectId(roomId),
        text: text.trim(),
      });

      fastify.io?.to(`user:${recipientId}`).emit('message:received', {
        id: doc._id.toString(),
        roomId,
        text: doc.text,
        createdAt: doc.createdAt.toISOString(),
        direction: 'in',
        thread: mirrorThread(to),
      });

      fastify.publishEvent('message:sent', { roomId, recipientId });

      request.log.info({ roomId, to }, 'Anonymous message sent');
      reply.code(201);

      return { ...toChatMessage(doc, me), thread: to };
    }
  );

  fastify.get(
    '/:roomId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['roomId'],
          properties: {
            roomId: objectIdSchema,
          },
        },
      },
    },
    async (request) => {
      const me = request.user.sub;
      const { roomId } = request.params as { roomId: string };
      const { gifteeId, santaId } = await fastify.santaApi.getRelations(roomId, me);

      const giftee = gifteeId
        ? {
            id: gifteeId,
            name: (await fastify.santaApi.getUserById(gifteeId)).displayName,
            messages: await conversation(roomId, me, gifteeId),
          }
        : null;

      const santa = santaId ? { messages: await conversation(roomId, me, santaId) } : null;

      return { giftee, santa };
    }
  );

  fastify.get('/unread', { preHandler: [fastify.authenticate] }, async (request) => {
    const me = new Types.ObjectId(request.user.sub);

    const rows = await MessageModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { recipientId: me, read: false } },
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
    ]);

    return {
      total: rows.reduce((sum, r) => sum + r.count, 0),
      rooms: rows.map((r) => ({ roomId: r._id.toString(), count: r.count })),
    };
  });

  fastify.patch(
    '/:roomId/read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: { type: 'object', required: ['roomId'], properties: { roomId: objectIdSchema } },
        body: {
          type: 'object',
          properties: { thread: { type: 'string', enum: ['giftee', 'santa'] } },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const me = request.user.sub;
      const { roomId } = request.params as { roomId: string };
      const { thread } = (request.body ?? {}) as { thread?: Thread };

      const { gifteeId, santaId } = await fastify.santaApi.getRelations(roomId, me);

      const targets: Array<{ senderId: string; myThread: Thread }> = [];

      if ((!thread || thread === 'giftee') && gifteeId) {
        targets.push({ senderId: gifteeId, myThread: 'giftee' });
      }

      if ((!thread || thread === 'santa') && santaId) {
        targets.push({ senderId: santaId, myThread: 'santa' });
      }

      if (targets.length === 0) return { updated: 0 };

      let updated = 0;

      for (const { senderId, myThread } of targets) {
        const res = await MessageModel.updateMany(
          {
            roomId: new Types.ObjectId(roomId),
            recipientId: new Types.ObjectId(me),
            senderId: new Types.ObjectId(senderId),
            read: false,
          },
          { $set: { read: true } }
        );

        updated += res.modifiedCount;

        if (res.modifiedCount > 0) {
          fastify.io?.to(`user:${senderId}`).emit('message:read', {
            roomId,
            thread: mirrorThread(myThread),
            count: res.modifiedCount,
          });
        }
      }

      return { updated };
    }
  );

  fastify.put(
    '/:id/reaction',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: objectIdSchema } },
        body: {
          type: 'object',
          required: ['emoji'],
          properties: { emoji: { type: ['string', 'null'], enum: [...REACTIONS, null] } },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const me = request.user.sub;
      const { id } = request.params as { id: string };
      const { emoji } = request.body as { emoji: Reaction | null };

      const doc = await MessageModel.findById(id).exec();

      if (!doc) throw new NotFoundError('Message', id);

      const senderId = doc.senderId.toString();
      const recipientId = doc.recipientId.toString();
      const iAmSender = senderId === me;

      if (!iAmSender && recipientId !== me) {
        throw new NotFoundError('Message', id);
      }

      const other = iAmSender ? recipientId : senderId;
      const roomId = doc.roomId.toString();

      const { gifteeId, santaId } = await fastify.santaApi.getRelations(roomId, me);
      const myThread: Thread | null =
        other === gifteeId ? 'giftee' : other === santaId ? 'santa' : null;

      if (!myThread) throw new NotFoundError('Message', id);

      doc.set(iAmSender ? { senderReaction: emoji } : { recipientReaction: emoji });
      await doc.save();

      fastify.io?.to(`user:${other}`).emit('message:reaction', {
        id,
        roomId,
        thread: mirrorThread(myThread),
        theirReaction: emoji,
      });

      return toChatMessage(doc, me);
    }
  );
}
