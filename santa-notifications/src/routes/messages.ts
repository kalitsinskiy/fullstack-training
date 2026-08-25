import { FastifyInstance } from 'fastify';
import { ForbiddenError } from '../errors';
import { MESSAGE_SENT_ROUTING_KEY } from '../events/topology';
import { currentUser } from '../plugins/auth';
import {
  MAX_MESSAGE_LENGTH,
  MessageDto,
  MessageModel,
  MessageThread,
  mirrorThread,
  toMessageDto,
} from '../models/message';
import type { RoomRelations } from '../services/santa-api-client';

const objectIdSchema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

const threadValues: MessageThread[] = ['giftee', 'santa'];

const CANNOT_SEND = 'You cannot send a message in this room yet';

// A generous per-user cap: high enough not to bother a real conversation,
// low enough to stop an authenticated user from spamming the endpoint.
const SEND_MESSAGE_RATE_LIMIT = { max: 30, timeWindow: '1 minute' };

interface SendMessageBody {
  roomId: string;
  to: MessageThread;
  text: string;
}

interface ThreadsResponse {
  giftee: { id: string; name: string; messages: MessageDto[] } | null;
  santa: { messages: MessageDto[] } | null;
}

export default async function messageRoutes(fastify: FastifyInstance) {
  async function relationsOf(roomId: string, userId: string): Promise<RoomRelations> {
    try {
      return await fastify.santaApi.getRelations(roomId, userId);
    } catch (error) {
      fastify.log.error({ err: error, roomId }, 'Could not resolve room relations');
      throw new ForbiddenError(CANNOT_SEND);
    }
  }

  async function displayNameOf(userId: string): Promise<string> {
    try {
      const user = await fastify.santaApi.getUserById(userId);
      return user.displayName;
    } catch (error) {
      fastify.log.warn({ err: error, userId }, 'Could not resolve giftee name');
      return 'Your giftee';
    }
  }

  async function conversation(
    roomId: string,
    viewerId: string,
    otherId: string
  ): Promise<MessageDto[]> {
    const messages = await MessageModel.find({
      roomId,
      $or: [
        { senderId: viewerId, recipientId: otherId },
        { senderId: otherId, recipientId: viewerId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return messages.map((message) => toMessageDto(message, viewerId));
  }

  fastify.post(
    '/',
    {
      preHandler: [
        fastify.authenticate,
        ...(fastify.config.env === 'test'
          ? []
          : [
              fastify.rateLimit({
                ...SEND_MESSAGE_RATE_LIMIT,
                keyGenerator: (request) => currentUser(request).id,
              }),
            ]),
      ],
      schema: {
        body: {
          type: 'object',
          required: ['roomId', 'to', 'text'],
          properties: {
            roomId: objectIdSchema,
            to: { type: 'string', enum: threadValues },
            text: {
              type: 'string',
              minLength: 1,
              maxLength: MAX_MESSAGE_LENGTH,
              pattern: '\\S',
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { id: senderId } = currentUser(request);
      const { roomId, to, text } = request.body as SendMessageBody;

      const trimmed = text.trim();
      const relations = await relationsOf(roomId, senderId);
      const recipientId = to === 'giftee' ? relations.gifteeId : relations.santaId;

      if (!recipientId) {
        throw new ForbiddenError(CANNOT_SEND);
      }

      const message = await MessageModel.create({
        senderId,
        recipientId,
        roomId,
        text: trimmed,
      });

      const dto = toMessageDto(message, senderId);

      fastify.realtime.toUser(recipientId, 'message:received', {
        ...toMessageDto(message, recipientId),
        thread: mirrorThread(to),
      });

      fastify.publishEvent(MESSAGE_SENT_ROUTING_KEY, {
        type: MESSAGE_SENT_ROUTING_KEY,
        roomId,
        recipientId,
      });

      request.log.info(
        { messageId: dto.id, roomId, thread: to },
        'Anonymous message relayed'
      );

      reply.code(201);
      return { ...dto, thread: to };
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
          properties: { roomId: objectIdSchema },
        },
      },
    },
    async (request) => {
      const { id: viewerId } = currentUser(request);
      const { roomId } = request.params as { roomId: string };

      const relations = await relationsOf(roomId, viewerId);

      const gifteeId = relations.gifteeId;
      const santaId = relations.santaId;

      const [giftee, santa] = await Promise.all([
        gifteeId
          ? Promise.all([
              displayNameOf(gifteeId),
              conversation(roomId, viewerId, gifteeId),
            ]).then(([name, messages]) => ({ id: gifteeId, name, messages }))
          : null,
        santaId ? conversation(roomId, viewerId, santaId) : null,
      ]);

      const response: ThreadsResponse = {
        giftee,
        santa: santa ? { messages: santa } : null,
      };

      return response;
    }
  );
}
