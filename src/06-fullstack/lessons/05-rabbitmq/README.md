# Lesson 05: RabbitMQ

## Quick Overview

So far, `santa-api` and `santa-notifications` are independent services with no communication between them. When something happens in `santa-api` (a room is created, the draw is completed, a wishlist is updated), `santa-notifications` has no way to know about it.

You could add direct HTTP calls from `santa-api` to `santa-notifications`, but that creates **tight coupling**: if the notification service is down, room creation would fail too. Instead, you will use **asynchronous messaging** with RabbitMQ. The API service publishes events to a message broker; the notification service consumes them whenever it is ready. If the notification service is temporarily down, messages wait in the queue until it comes back.

By the end of this lesson you will have:

- RabbitMQ running in Docker with a management UI
- An event publisher in santa-api that publishes domain events
- An event consumer in santa-notifications that creates notifications from events
- A dead letter queue for messages that cannot be processed
- Message acknowledgment to ensure reliable delivery

---

## Key Concepts

### 1. Why Asynchronous Messaging?

| Concern | Synchronous (HTTP) | Asynchronous (Message Queue) |
|---------|--------------------|------------------------------|
| **Coupling** | Producer must know the consumer's URL and API | Producer only knows the exchange name |
| **Availability** | If consumer is down, producer's request fails | Messages queue up, consumer processes them when ready |
| **Scalability** | One-to-one communication | One producer, many consumers (fan-out) |
| **Speed** | Producer waits for response | Producer publishes and moves on (fire-and-forget) |
| **Reliability** | Lost if consumer fails mid-request | Messages are persisted in the queue until acknowledged |

Asynchronous messaging is ideal for operations that do not need an immediate response: sending notifications, updating analytics, triggering background jobs.

### 2. RabbitMQ Core Concepts

```
Producer --> Exchange --> Binding --> Queue --> Consumer

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ santa-api │───>│ Exchange │───>│  Queue   │───>│santa-    │
│ (publish) │    │          │    │          │    │notif.    │
└──────────┘    └──────────┘    └──────────┘    │(consume) │
                                                └──────────┘
```

| Concept | Description |
|---------|-------------|
| **Producer** | The application that sends messages (santa-api). |
| **Exchange** | Receives messages from producers and routes them to queues based on rules. |
| **Queue** | A buffer that stores messages until a consumer picks them up. |
| **Binding** | A rule that connects an exchange to a queue, optionally with a routing key pattern. |
| **Routing Key** | A string the producer attaches to each message. The exchange uses it to decide which queue(s) get the message. |
| **Consumer** | The application that receives and processes messages (santa-notifications). |

### 3. Exchange Types

| Type | Routing Logic | Use Case |
|------|---------------|----------|
| **Direct** | Exact match on routing key. Message goes to queues bound with that exact key. | Task queues: `email.send`, `sms.send` |
| **Topic** | Pattern match on routing key using `*` (one word) and `#` (zero or more words). | Event routing: `room.created`, `room.*`, `#.completed` |
| **Fanout** | Ignores routing key. Sends message to **all** bound queues. | Broadcast to all consumers |
| **Headers** | Routes based on message headers instead of routing key. | Advanced filtering |

For the Secret Santa app, **topic** exchange is the best fit. Events have structured names like `room.created`, `user.joined`, `draw.completed`, and consumers can subscribe to specific patterns.

```
Exchange: "santa.events" (topic)

Producer sends:
  routing_key: "room.created"    --> matches binding "room.*" and "room.created"
  routing_key: "draw.completed"  --> matches binding "draw.*" and "#.completed"
  routing_key: "user.joined"     --> matches binding "user.*"
```

### 4. Message Acknowledgment

When a consumer receives a message, it must **acknowledge** (ack) it to tell RabbitMQ the message was processed successfully. Until acknowledged, RabbitMQ keeps the message in the queue. If the consumer crashes without acknowledging, RabbitMQ redelivers the message to another consumer (or the same one after restart).

```typescript
channel.consume(queue, async (msg) => {
  try {
    const event = JSON.parse(msg.content.toString());
    await processEvent(event);

    // Success: acknowledge the message
    channel.ack(msg);
  } catch (error) {
    // Failure: reject and optionally requeue
    channel.nack(msg, false, false); // false = don't requeue (send to DLQ)
  }
});
```

| Method | Effect |
|--------|--------|
| `ack(msg)` | Message is removed from the queue (processed successfully) |
| `nack(msg, false, true)` | Message is requeued (try again later) |
| `nack(msg, false, false)` | Message is discarded or sent to the dead letter queue |

### 5. Dead Letter Queues (DLQ)

A **dead letter queue** is where messages go when they cannot be processed. A message becomes "dead" when:
- It is rejected (`nack` without requeue)
- Its TTL expires
- The queue reaches its maximum length

DLQ lets you inspect failed messages later, fix the issue, and reprocess them. Without a DLQ, failed messages are simply lost.

```
Normal flow:
  Exchange --> Queue --> Consumer (ack) ✓

Error flow:
  Exchange --> Queue --> Consumer (nack) --> Dead Letter Exchange --> DLQ
```

Setting up a DLQ:

```typescript
// Declare the dead letter exchange and queue
await channel.assertExchange('santa.dlx', 'fanout', { durable: true });
await channel.assertQueue('santa.dlq', { durable: true });
await channel.bindQueue('santa.dlq', 'santa.dlx', '');

// Declare the main queue with dead letter config
await channel.assertQueue('notifications.events', {
  durable: true,
  deadLetterExchange: 'santa.dlx',   // Where rejected messages go
  deadLetterRoutingKey: '',           // Optional routing key for DLQ
});
```

### 6. Idempotency

Messages can be delivered more than once (e.g., if the consumer crashes after processing but before acknowledging). Your consumer must handle duplicate messages gracefully.

Strategies:
- **Use a unique message ID**: store processed message IDs and skip duplicates.
- **Make operations naturally idempotent**: "set notification as created" is idempotent; "increment counter" is not.

```typescript
channel.consume(queue, async (msg) => {
  const event = JSON.parse(msg.content.toString());
  const messageId = msg.properties.messageId;

  // Check if we already processed this message
  const exists = await Notification.findOne({ messageId });
  if (exists) {
    channel.ack(msg); // Already processed, just ack
    return;
  }

  // Process the event
  await createNotification(event, messageId);
  channel.ack(msg);
});
```

### 7. amqplib in Node.js

[amqplib](https://www.npmjs.com/package/amqplib) is the standard Node.js client for RabbitMQ:

```typescript
import amqp from 'amqplib';

// Connect
const connection = await amqp.connect('amqp://rabbitmq:5672');
const channel = await connection.createChannel();

// Declare exchange
await channel.assertExchange('santa.events', 'topic', { durable: true });

// Publish a message
channel.publish(
  'santa.events',       // exchange name
  'room.created',       // routing key
  Buffer.from(JSON.stringify({
    roomId: '123',
    roomName: 'Office Party',
    createdBy: 'user456',
    timestamp: new Date().toISOString(),
  })),
  {
    persistent: true,    // Survive broker restart
    messageId: uuid(),   // Unique ID for idempotency
    contentType: 'application/json',
  }
);

// Close gracefully
await channel.close();
await connection.close();
```

### 8. Retry Patterns

For transient errors (database temporarily unavailable, network blip), you may want to retry instead of sending straight to the DLQ. A common pattern is to use a **delay queue**:

1. Consumer fails to process a message.
2. Message is sent to a delay exchange with a TTL (e.g., 5 seconds).
3. After the TTL, the message is routed back to the main queue.
4. After N retries, send to DLQ.

You can track retry count in message headers:

```typescript
const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
const maxRetries = 3;

if (retryCount > maxRetries) {
  channel.nack(msg, false, false); // Send to DLQ
} else {
  // Republish with incremented retry count
  channel.publish(
    'santa.events.retry',
    msg.fields.routingKey,
    msg.content,
    { headers: { 'x-retry-count': retryCount } }
  );
  channel.ack(msg);
}
```

---

## Task

### Step 1: Add RabbitMQ to docker-compose.yml

Add a RabbitMQ service with the management plugin (provides a web UI):

```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  ports:
    - '5672:5672'    # AMQP protocol
    - '15672:15672'  # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: santa
    RABBITMQ_DEFAULT_PASS: santa
  volumes:
    - rabbitmq-data:/var/lib/rabbitmq
  healthcheck:
    test: rabbitmq-diagnostics -q ping
    interval: 10s
    timeout: 5s
    retries: 5
```

Add `rabbitmq-data` to the volumes section. Add `RABBITMQ_URL` to the environment of both backend services:

```yaml
environment:
  - RABBITMQ_URL=amqp://santa:santa@rabbitmq:5672
```

Update both services to depend on RabbitMQ with `condition: service_healthy`.

### Step 2: Create EventPublisher in santa-api

1. Install amqplib:
   ```bash
   cd santa-api && npm install amqplib && npm install -D @types/amqplib
   ```

2. Create an `EventsModule` with an `EventPublisherService` that:
   - Connects to RabbitMQ on module initialization
   - Creates a topic exchange named `santa.events`
   - Provides a `publish(routingKey: string, data: object)` method
   - Sets messages as persistent
   - Adds a unique `messageId` to each message
   - Handles graceful shutdown (close channel and connection)

```typescript
@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('santa.events', 'topic', { durable: true });
  }

  async publish(routingKey: string, data: object): Promise<void> {
    this.channel.publish(
      'santa.events',
      routingKey,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true,
        messageId: randomUUID(),
        contentType: 'application/json',
        timestamp: Date.now(),
      }
    );
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

3. Add `RABBITMQ_URL` to your config validation schema.

### Step 3: Publish events from existing flows

Inject `EventPublisherService` into the relevant services and publish events after successful operations:

| Event | Routing Key | When to Publish | Payload |
|-------|-------------|-----------------|---------|
| Room created | `room.created` | After a new room is saved to DB | `{ roomId, roomName, createdBy }` |
| User joined | `user.joined` | After a user joins a room | `{ roomId, userId, userName }` |
| Draw completed | `draw.completed` | After the draw transaction commits | `{ roomId, participantCount }` |
| Wishlist updated | `wishlist.updated` | After a user updates their wishlist | `{ roomId, userId }` |

Example integration:

```typescript
// In RoomService.createRoom():
const room = await this.roomModel.create(createRoomDto);
await this.eventPublisher.publish('room.created', {
  roomId: room._id,
  roomName: room.name,
  createdBy: room.createdBy,
});
return room;
```

**Important:** publish events *after* the database operation succeeds. If you publish before and the DB write fails, you have sent a notification about something that did not happen.

### Step 4: Create EventConsumer in santa-notifications

1. Install amqplib in santa-notifications:
   ```bash
   cd santa-notifications && npm install amqplib && npm install -D @types/amqplib
   ```

2. Create a consumer module/plugin that:
   - Connects to RabbitMQ on startup
   - Creates (asserts) a queue `notifications.events`
   - Binds the queue to `santa.events` exchange with routing patterns:
     - `room.created`
     - `user.joined`
     - `draw.completed`
     - `wishlist.updated`
   - Consumes messages from the queue
   - For each event, creates a `Notification` document in MongoDB

3. Create a Notification schema if you do not have one:

```typescript
// Schema fields:
// - type:      string (e.g., 'room.created', 'user.joined')
// - roomId:    string
// - userId:    string (the user this notification is for, if applicable)
// - message:   string (human-readable, e.g., "Alice joined Office Party")
// - read:      boolean (default: false)
// - messageId: string (from RabbitMQ, for idempotency)
// - timestamps: true
```

4. Generate a human-readable message based on the event type:

```typescript
function buildNotificationMessage(routingKey: string, data: any): string {
  switch (routingKey) {
    case 'room.created':
      return `Room "${data.roomName}" was created`;
    case 'user.joined':
      return `${data.userName} joined the room`;
    case 'draw.completed':
      return `The draw is complete! Check your assignment`;
    case 'wishlist.updated':
      return `A wishlist was updated in your room`;
    default:
      return `New event: ${routingKey}`;
  }
}
```

### Step 5: Implement message acknowledgment

In the consumer, use proper acknowledgment:

```typescript
channel.consume(queue, async (msg) => {
  if (!msg) return;

  try {
    const routingKey = msg.fields.routingKey;
    const data = JSON.parse(msg.content.toString());
    const messageId = msg.properties.messageId;

    // Idempotency check
    const existing = await Notification.findOne({ messageId });
    if (existing) {
      channel.ack(msg);
      return;
    }

    // Process
    await Notification.create({
      type: routingKey,
      roomId: data.roomId,
      message: buildNotificationMessage(routingKey, data),
      messageId,
    });

    channel.ack(msg);
  } catch (error) {
    console.error('Failed to process message:', error);
    channel.nack(msg, false, false); // Send to DLQ
  }
});
```

### Step 6: Set up Dead Letter Queue

Configure a DLQ so failed messages are not lost:

1. Create a dead letter exchange (`santa.dlx`, type `fanout`)
2. Create a dead letter queue (`santa.dlq`)
3. Bind the DLQ to the DLX
4. Configure the main queue (`notifications.events`) to use the DLX

```typescript
// Dead letter setup
await channel.assertExchange('santa.dlx', 'fanout', { durable: true });
await channel.assertQueue('santa.dlq', { durable: true });
await channel.bindQueue('santa.dlq', 'santa.dlx', '');

// Main queue with dead letter config
await channel.assertQueue('notifications.events', {
  durable: true,
  deadLetterExchange: 'santa.dlx',
});
```

---

## Verification

```bash
# 1. Start the stack
docker-compose up --build

# 2. Open the RabbitMQ Management UI
# Open http://localhost:15672 in your browser
# Login: santa / santa
# You should see the exchange "santa.events" and queue "notifications.events"

# 3. Create a room (this should publish a room.created event)
curl -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Test Room"}'

# 4. Check the RabbitMQ Management UI
# - Go to Queues tab -> notifications.events
# - Message rate should show 1 message was delivered
# - The "Get messages" button can show message contents

# 5. Check the notification was created in santa-notifications DB
docker-compose exec mongo mongosh santa --eval \
  'db.notifications.find().sort({createdAt: -1}).limit(5).pretty()'
# Expected: A notification document with type "room.created"

# 6. Have a user join the room (should publish user.joined event)
curl -X POST http://localhost:3001/rooms/{roomId}/join \
  -H "Authorization: Bearer $TOKEN_BOB"

# Check for new notification
docker-compose exec mongo mongosh santa --eval \
  'db.notifications.find({type: "user.joined"}).pretty()'

# 7. Test the DLQ
# You can test by temporarily making the consumer throw an error.
# After processing fails, check:
docker-compose exec mongo mongosh santa --eval \
  'db.notifications.countDocuments()'

# In RabbitMQ Management UI, check the santa.dlq queue for dead-lettered messages.

# 8. Test idempotency
# Restart santa-notifications (messages may redeliver):
docker-compose restart santa-notifications
# Check that no duplicate notifications were created.

# 9. Verify exchange and queue details
docker-compose exec rabbitmq rabbitmqctl list_exchanges | grep santa
# Expected: santa.events   topic
#           santa.dlx       fanout

docker-compose exec rabbitmq rabbitmqctl list_queues
# Expected: notifications.events   0  (no pending messages if consumer is running)
#           santa.dlq              0  (or more if messages failed)

# 10. Monitor messages in real-time
# In the RabbitMQ Management UI, go to the exchange "santa.events"
# and check message rates as you perform actions in the API.
```
