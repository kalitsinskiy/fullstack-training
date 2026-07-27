import type { Channel, ConsumeMessage } from 'amqplib';
import { NotificationModel, NotificationType } from '../models/notification';
import { buildNotificationMessage } from './messages';

export async function handleMessage(channel: Channel, msg: ConsumeMessage | null): Promise<void> {
  if (!msg) return;

  try {
    const routingKey = msg.fields.routingKey as NotificationType;
    const messageId = msg.properties.messageId as string | undefined;
    const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;

    if (messageId) {
      const existing = await NotificationModel.findOne({ messageId }).lean();

      if (existing) {
        channel.ack(msg);
        return;
      }
    }

    await NotificationModel.create({
      type: routingKey,
      roomId: data.roomId as string | undefined,
      userId: data.userId as string | undefined,
      message: buildNotificationMessage(routingKey, data),
      messageId,
    });

    channel.ack(msg);
  } catch {
    channel.nack(msg, false, false);
  }
}
