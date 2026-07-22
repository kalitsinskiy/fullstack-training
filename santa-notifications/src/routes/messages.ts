import { FastifyInstance } from 'fastify';
import { Message } from '../models/message';
import { getSantaApiClient } from '../services/santa-api-client';
import { getIo } from '../io-instance';

const sendBodySchema = {
  type: 'object',
  required: ['roomId', 'to', 'text'],
  properties: {
    roomId: { type: 'string' },
    to: { type: 'string', enum: ['giftee', 'santa'] },
    text: { type: 'string', minLength: 1, maxLength: 500 },
  },
};

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: { body: sendBodySchema },
    },
    async (request, reply) => {
      const senderId = request.user.sub;
      const { roomId, to, text } = request.body as {
        roomId: string;
        to: 'giftee' | 'santa';
        text: string;
      };

      const client = getSantaApiClient(
        fastify.config.santaApiUrl,
        fastify.config.serviceApiKey,
      );

      let relations: { gifteeId: string | null; santaId: string | null };
      try {
        relations = await client.getRelations(roomId, senderId);
      } catch {
        return reply.status(403).send({ message: 'Unable to verify assignment' });
      }

      const recipientId = to === 'giftee' ? relations.gifteeId : relations.santaId;
      if (!recipientId) {
        return reply.status(403).send({ message: 'No assignment found for this room' });
      }

      const message = await Message.create({
        senderId,
        recipientId,
        roomId,
        text: text.trim(),
      });

      // thread is the mirror: sender's "giftee" arrives in recipient's "santa" chat
      const recipientThread: 'giftee' | 'santa' = to === 'giftee' ? 'santa' : 'giftee';

      try {
        const io = getIo();
        io.to(`user:${recipientId}`).emit('message:received', {
          id: message._id,
          roomId: message.roomId,
          text: message.text,
          createdAt: message.createdAt,
          direction: 'in',
          thread: recipientThread,
        });
      } catch {
        // io not ready yet — skip
      }

      await fastify.publish('message.sent', {
        type: 'message.sent',
        roomId,
        recipientId,
      });

      return reply.status(201).send({
        id: message._id,
        roomId: message.roomId,
        text: message.text,
        createdAt: message.createdAt,
        direction: 'out',
        thread: to,
      });
    },
  );

  fastify.get(
    '/:roomId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const me = request.user.sub;
      const { roomId } = request.params as { roomId: string };

      const client = getSantaApiClient(
        fastify.config.santaApiUrl,
        fastify.config.serviceApiKey,
      );

      let relations: { gifteeId: string | null; santaId: string | null };
      try {
        relations = await client.getRelations(roomId, me);
      } catch {
        return reply.status(403).send({ message: 'Unable to verify assignment' });
      }

      const { gifteeId, santaId } = relations;

      async function fetchThread(other: string | null) {
        if (!other) return [];
        const docs = await Message.find({
          roomId,
          $or: [
            { senderId: me, recipientId: other },
            { senderId: other, recipientId: me },
          ],
        })
          .sort({ createdAt: 1 })
          .lean();

        return docs.map((d) => ({
          id: d._id.toString(),
          roomId: d.roomId,
          text: d.text,
          createdAt: d.createdAt,
          direction: d.senderId === me ? 'out' : 'in',
        }));
      }

      let gifteeName: string | null = null;
      if (gifteeId) {
        try {
          const user = await client.getUserById(gifteeId);
          gifteeName = user.displayName;
        } catch {
          gifteeName = null;
        }
      }

      const [gifteeMessages, santaMessages] = await Promise.all([
        fetchThread(gifteeId),
        fetchThread(santaId),
      ]);

      return {
        giftee: gifteeId
          ? { id: gifteeId, name: gifteeName, messages: gifteeMessages }
          : null,
        santa: santaId
          ? { messages: santaMessages }
          : null,
      };
    },
  );
}
