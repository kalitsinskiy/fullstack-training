import { FastifyInstance } from 'fastify';
import { Message } from '../models/message';
import { getSantaApiClient } from '../services/santa-api-client';
import { getIO } from '../realtime';
import { publish } from '../services/publisher';

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const senderId = request.user.sub;
      const { roomId, to, text } = request.body as {
        roomId: string;
        to: 'giftee' | 'santa';
        text: string;
      };

      if (!roomId || (to !== 'giftee' && to !== 'santa') || !text?.trim()) {
        return reply
          .status(400)
          .send({ message: 'roomId, to (giftee|santa), and text are required' });
      }

      if (text.length > 500) {
        return reply.status(400).send({ message: 'Message must be 500 characters or less' });
      }

      let relations: { gifteeId: string | null; santaId: string | null };
      try {
        relations = await getSantaApiClient().getRelations(roomId, senderId);
      } catch {
        return reply.status(403).send({ message: 'Unable to verify assignment' });
      }

      const recipientId = to === 'giftee' ? relations.gifteeId : relations.santaId;
      if (!recipientId) {
        return reply.status(403).send({ message: 'You are not assigned in this room' });
      }

      const message = await Message.create({
        senderId,
        recipientId,
        roomId,
        text: text.trim(),
      });

      const recipientThread = to === 'giftee' ? 'santa' : 'giftee';

      const io = getIO();
      io.to(`user:${recipientId}`).emit('message:received', {
        id: message._id,
        roomId: message.roomId,
        text: message.text,
        createdAt: message.createdAt,
        direction: 'in',
        thread: recipientThread,
      });

      publish('message.sent', { type: 'message.sent', roomId, recipientId });

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

      let relations: { gifteeId: string | null; santaId: string | null };
      try {
        relations = await getSantaApiClient().getRelations(roomId, me);
      } catch {
        return reply.status(403).send({ message: 'Unable to fetch relations' });
      }

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
          id: d._id,
          roomId: d.roomId,
          text: d.text,
          createdAt: d.createdAt,
          direction: d.senderId === me ? 'out' : 'in',
        }));
      }

      const [gifteeMessages, santaMessages] = await Promise.all([
        fetchThread(relations.gifteeId),
        fetchThread(relations.santaId),
      ]);

      let gifteeName: string | null = null;
      if (relations.gifteeId) {
        try {
          const user = await getSantaApiClient().getUserById(relations.gifteeId);
          gifteeName = user.displayName;
        } catch {
          gifteeName = null;
        }
      }

      return reply.send({
        giftee: relations.gifteeId
          ? { id: relations.gifteeId, name: gifteeName, messages: gifteeMessages }
          : null,
        santa: relations.santaId
          ? { messages: santaMessages }
          : null,
      });
    },
  );
}
