import { FastifyInstance } from 'fastify';
import { AppError } from '../errors';
import { MessageModel } from '../models/message';
import { SantaApiClient } from '../services/santa-api-client';
import { getIO } from '../realtime';

const objectId = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

const sendBodySchema = {
  type: 'object',
  required: ['roomId', 'to', 'text'],
  additionalProperties: false,
  properties: {
    roomId: objectId,
    // Which relationship you're messaging — your giftee (you know them) or your
    // anonymous Secret Santa (the server resolves who that is).
    to: { type: 'string', enum: ['giftee', 'santa'] },
    text: { type: 'string', minLength: 1, maxLength: 500 },
  },
};

const roomParamsSchema = {
  type: 'object',
  required: ['roomId'],
  properties: { roomId: objectId },
};

type ThreadSide = 'giftee' | 'santa';

// What a client is ever allowed to see for a message: never senderId.
interface ThreadMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
}

export default async function messageRoutes(fastify: FastifyInstance) {
  const api = new SantaApiClient(
    fastify.config.santaApiUrl,
    fastify.config.serviceApiKey,
  );

  const toThreadMessage = (
    m: { _id: unknown; roomId: string; text: string; createdAt: Date; senderId: string },
    me: string,
  ): ThreadMessage => ({
    id: String(m._id),
    roomId: m.roomId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    direction: m.senderId === me ? 'out' : 'in',
  });

  // Send a message along one of your two relationships. The server resolves the
  // recipient from the assignment graph, so the sender never needs (and for the
  // Santa side, never learns) the recipient's id.
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate], schema: { body: sendBodySchema } },
    async (request, reply) => {
      const senderId = request.user!.id;
      const { roomId, to, text } = request.body as {
        roomId: string;
        to: ThreadSide;
        text: string;
      };

      const relations = await api.getRelations(roomId, senderId);
      const recipientId =
        to === 'giftee' ? relations.gifteeId : relations.santaId;
      if (!recipientId) {
        throw new AppError(
          'No one to message here yet — the draw must be done first',
          403,
          'FORBIDDEN',
        );
      }

      const message = await MessageModel.create({
        senderId,
        recipientId,
        roomId,
        text: text.trim(),
      });

      // From the recipient's perspective the thread is the mirror of the
      // sender's: if I message my giftee, I am that person's Santa, so it lands
      // in their "santa" thread (and vice-versa).
      const recipientThread: ThreadSide = to === 'giftee' ? 'santa' : 'giftee';

      // Live push — WITHOUT senderId. `thread` tells the recipient which of
      // their two chats it belongs to.
      getIO()
        ?.to(`user:${recipientId}`)
        .emit('message:received', {
          id: message._id.toString(),
          roomId,
          text: message.text,
          createdAt: message.createdAt.toISOString(),
          direction: 'in',
          thread: recipientThread,
        });

      return reply.status(201).send({
        id: message._id.toString(),
        roomId,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        direction: 'out',
        thread: to,
      });
    },
  );

  // The caller's two conversations for a room: with their giftee (named — they
  // know who it is) and with their Secret Santa (anonymous — never named).
  fastify.get(
    '/:roomId',
    { preHandler: [fastify.authenticate], schema: { params: roomParamsSchema } },
    async (request) => {
      const me = request.user!.id;
      const { roomId } = request.params as { roomId: string };
      const relations = await api.getRelations(roomId, me);

      const conversationWith = async (other: string) => {
        const docs = await MessageModel.find({
          roomId,
          $or: [
            { senderId: me, recipientId: other },
            { senderId: other, recipientId: me },
          ],
        })
          .sort({ createdAt: 1 })
          .lean();
        return docs.map((d) =>
          toThreadMessage(
            { ...d, _id: d._id, senderId: d.senderId },
            me,
          ),
        );
      };

      // Giftee thread — include the giftee's name (the caller is allowed to
      // know who they're gifting).
      let giftee: { id: string; name: string; messages: ThreadMessage[] } | null =
        null;
      if (relations.gifteeId) {
        const [messages, user] = await Promise.all([
          conversationWith(relations.gifteeId),
          api.getUserById(relations.gifteeId).catch(() => null),
        ]);
        giftee = {
          id: relations.gifteeId,
          name: user?.displayName ?? 'Your giftee',
          messages,
        };
      }

      // Santa thread — anonymous. No id, no name ever.
      let santa: { messages: ThreadMessage[] } | null = null;
      if (relations.santaId) {
        santa = { messages: await conversationWith(relations.santaId) };
      }

      return { giftee, santa };
    },
  );
}
