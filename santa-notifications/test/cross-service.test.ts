import { connect, type Channel, type ChannelModel } from 'amqplib';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { handleEvent, type EventPayload } from '../src/events/handle-event';
import { NotificationModel } from '../src/models/notification';
import { EVENT_ROUTING_KEYS, SANTA_EVENTS_EXCHANGE } from '../src/events/topology';
import { FakeSantaApi } from './helpers/fake-santa-api';
import { clearTestDb, setupTestDb, teardownTestDb } from './helpers/db';

/**
 * CROSS-SERVICE TEST — the one suite that talks to a **real RabbitMQ**.
 *
 * Everything else in this folder tests the handler directly (events.test.ts) or
 * the HTTP surface (notifications.test.ts). This one closes the last gap: that a
 * message *published the way santa-api publishes it* actually reaches us through
 * the broker, gets handled, lands in MongoDB, and is then readable over HTTP.
 *
 *   [test publishes] -> santa.events (real exchange, topic)
 *                    -> our own test queue -> handleEvent -> in-memory Mongo
 *                    -> GET /api/notifications (app.inject)
 *
 * Two deliberate choices:
 *  - **Our own queue.** We bind a temporary `autoDelete` queue instead of
 *    consuming `notifications.events`, so we never steal messages from a
 *    running santa-notifications instance. (A live instance still receives its
 *    own copy of our test event and dead-letters it, because the test room does
 *    not exist in santa-api — harmless, but that's why the room id is obviously
 *    synthetic.)
 *  - **A fake santa-api.** The enrichment HTTP call is faked, exactly as in
 *    events.test.ts, so the test needs a broker but not the whole stack.
 *
 * If no broker is reachable the tests log a skip instead of failing, so
 * `npm test` still passes offline. Start one with `docker compose up -d`.
 */

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://santa:santa123@localhost:5672';
const TEST_QUEUE = 'notifications.events.cross-service-test';
const CONNECT_TIMEOUT_MS = 3_000;

const ROOM_ID = '665f0c2ab7d13a5e8b1c4dff';
const ALICE = '665f0c2ab7d13a5e8b1c4d01';
const BOB = '665f0c2ab7d13a5e8b1c4d02';
const CAROL = '665f0c2ab7d13a5e8b1c4d03';

/** Poll until `check` stops throwing, or give up after `timeoutMs`. */
async function waitFor<T>(
  check: () => Promise<T>,
  timeoutMs = 5_000,
  intervalMs = 100
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      return await check();
    } catch (error) {
      if (Date.now() >= deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

describe('cross-service: santa-api events → notifications', () => {
  let connection: ChannelModel | undefined;
  let channel: Channel | undefined;
  let app: FastifyInstance;
  let api: FakeSantaApi;
  let consumerTag: string | undefined;

  const bearer = (userId: string) =>
    `Bearer ${app.jwt.sign({ sub: userId, email: 'user@test.com', role: 'user' })}`;

  /**
   * Runs `fn` only when a broker is reachable; otherwise logs a visible skip.
   * Keeps the suite green on a machine with no Docker running.
   */
  function itWithBroker(
    name: string,
    fn: (channel: Channel) => Promise<void>,
    timeout = 20_000
  ): void {
    it(
      name,
      async () => {
        if (!channel) {
          console.warn(`⚠ SKIPPED (no RabbitMQ at ${RABBITMQ_URL}): ${name}`);
          return;
        }
        await fn(channel);
      },
      timeout
    );
  }

  beforeAll(async () => {
    await setupTestDb();
    await NotificationModel.syncIndexes();

    try {
      connection = await connect(RABBITMQ_URL, { timeout: CONNECT_TIMEOUT_MS });
      // Never let a late broker error crash the whole run.
      connection.on('error', () => {});
      channel = await connection.createChannel();
      channel.on('error', () => {});

      // The same exchange santa-api publishes to, plus a throwaway queue of our
      // own bound to every event routing key. `exclusive` ties the queue to this
      // connection, so it disappears when the run ends — and it survives a
      // consumer being cancelled between tests, which `autoDelete` would not.
      // (RabbitMQ 4 also rejects transient queues that are not exclusive.)
      await channel.assertExchange(SANTA_EVENTS_EXCHANGE, 'topic', { durable: true });
      await channel.assertQueue(TEST_QUEUE, { durable: false, exclusive: true });
      for (const routingKey of EVENT_ROUTING_KEYS) {
        await channel.bindQueue(TEST_QUEUE, SANTA_EVENTS_EXCHANGE, routingKey);
      }
      await channel.prefetch(1);
    } catch (error) {
      console.warn(
        `⚠ RabbitMQ unreachable at ${RABBITMQ_URL} — cross-service tests will skip.`,
        (error as Error).message
      );
      connection = undefined;
      channel = undefined;
    }
  }, 30_000);

  afterAll(async () => {
    // The channel/connection may already be dead — closing is best-effort.
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch {
      /* already closed */
    }
    await teardownTestDb();
  }, 30_000);

  beforeEach(async () => {
    await clearTestDb();
    await NotificationModel.syncIndexes();

    api = new FakeSantaApi(
      { [ROOM_ID]: { id: ROOM_ID, name: 'Office Party', memberIds: [ALICE, BOB, CAROL] } },
      { [BOB]: { id: BOB, displayName: 'Bob', email: 'bob@test.com' } }
    );

    app = buildApp({ santaApi: api });
    await app.ready();

    if (!channel) return;

    // Drain anything a previous test left behind, then start consuming exactly
    // like the consumer plugin does: handle → ack, throw → dead-letter.
    await channel.purgeQueue(TEST_QUEUE);
    const consumer = await channel.consume(TEST_QUEUE, (message) => {
      if (!message || !channel) return;
      const payload = JSON.parse(message.content.toString()) as EventPayload;
      void handleEvent(message.fields.routingKey, payload, message.properties.messageId, {
        api,
      })
        .then(() => channel?.ack(message))
        .catch(() => channel?.nack(message, false, false));
    });
    consumerTag = consumer.consumerTag;
  });

  afterEach(async () => {
    if (channel && consumerTag) {
      await channel.cancel(consumerTag);
      consumerTag = undefined;
    }
    await app.close();
  });

  /** Publish like santa-api's EventPublisherService does: topic + messageId. */
  function publish(channel: Channel, routingKey: string, payload: EventPayload, messageId: string) {
    const ok = channel.publish(
      SANTA_EVENTS_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { messageId, contentType: 'application/json', persistent: true }
    );
    expect(ok).toBe(true);
  }

  itWithBroker(
    'a published draw.completed notifies all three participants, readable over HTTP',
    async (channel) => {
      publish(channel, 'draw.completed', { roomId: ROOM_ID }, 'cross-draw-1');

      // 1. The event travelled through the broker and fanned out in Mongo.
      const notifications = await waitFor(async () => {
        const found = await NotificationModel.find({ roomId: ROOM_ID }).exec();
        if (found.length < 3) throw new Error(`only ${found.length} so far`);
        return found;
      });

      expect(notifications).toHaveLength(3);
      expect(notifications.map((n) => n.userId?.toString()).sort()).toEqual(
        [ALICE, BOB, CAROL].sort()
      );
      expect(notifications[0].type).toBe('draw.completed');
      expect(notifications[0].message).toBe(
        'The draw for "Office Party" is complete — check your giftee!'
      );
      expect(notifications[0].read).toBe(false);

      // 2. And Alice can read hers through the API, with her unread count.
      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: { authorization: bearer(ALICE) },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        data: { type: string; message: string; roomId: string | null }[];
        unreadCount: number;
      };
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        type: 'draw.completed',
        message: 'The draw for "Office Party" is complete — check your giftee!',
        roomId: ROOM_ID,
      });
      expect(body.unreadCount).toBe(1);
    }
  );

  itWithBroker(
    'user.joined routes by its own key and skips the joiner',
    async (channel) => {
      publish(channel, 'user.joined', { roomId: ROOM_ID, userId: BOB }, 'cross-join-1');

      const notifications = await waitFor(async () => {
        const found = await NotificationModel.find().exec();
        if (found.length < 2) throw new Error(`only ${found.length} so far`);
        return found;
      });

      // Alice and Carol hear about it; Bob does not get told he joined.
      expect(notifications.map((n) => n.userId?.toString()).sort()).toEqual(
        [ALICE, CAROL].sort()
      );
      expect(notifications[0].message).toBe('Bob joined "Office Party"');

      // The name was resolved over (faked) HTTP, proving enrichment ran here too.
      expect(api.userCalls).toEqual([BOB]);
    }
  );

  itWithBroker(
    'a redelivered message is deduplicated by messageId across the broker',
    async (channel) => {
      publish(channel, 'draw.completed', { roomId: ROOM_ID }, 'cross-dupe-1');
      await waitFor(async () => {
        const count = await NotificationModel.countDocuments();
        if (count < 3) throw new Error(`only ${count} so far`);
        return count;
      });

      // Same messageId again — the producer retried, or the broker redelivered.
      publish(channel, 'draw.completed', { roomId: ROOM_ID }, 'cross-dupe-1');

      // Give the consumer time to process it, then assert nothing was added.
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      await expect(NotificationModel.countDocuments()).resolves.toBe(3);
    }
  );
});
