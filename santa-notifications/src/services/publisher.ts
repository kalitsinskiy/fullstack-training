import * as amqp from 'amqplib';
import { assertTopology } from '../consumer';

const EXCHANGE = 'santa.events';

let _channel: amqp.Channel | null = null;

export async function initPublisher(rabbitmqUrl: string): Promise<void> {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  // Assert the full topology (exchange + queue + bindings) here so events
  // published before the consumer starts are routed to the queue, not dropped.
  await assertTopology(channel);
  _channel = channel;
}

export function publish(routingKey: string, payload: unknown): void {
  if (!_channel) return;
  try {
    _channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  } catch {
    // non-fatal: fire-and-forget
  }
}
