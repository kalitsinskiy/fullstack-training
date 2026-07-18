import * as amqp from 'amqplib';

const EXCHANGE = 'santa.events';

let _channel: amqp.Channel | null = null;

export async function initPublisher(rabbitmqUrl: string): Promise<void> {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
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
