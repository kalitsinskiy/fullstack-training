import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';
import {
  IncomingMessage,
  IncomingReaction,
  MessageThreadKey,
  MessageThreads,
} from '@/types/api';
import { messageKey, unreadMessagesKey } from '../messages/hooks';
import { notificationsKey } from '../notifications/hooks';
import { patchMessage } from '../messages/patch-message';

interface NotificationPayload {
  id: string;
  type: string;
  message: string;
}

const ICONS: Record<string, string> = {
  'room.created': '🎁',
  'user.joined': '👋',
  'draw.completed': '🎉',
  'wishlist.updated': '📝',
};

export function SocketNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const onNotification = (payload: NotificationPayload) => {
      toast(payload.message, { icon: ICONS[payload.type] ?? '🔔' });
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    };

    const onMessage = (payload: IncomingMessage) => {
      toast('New anonymous message 💬', {
        description:
          payload.text.length > 60
            ? `${payload.text.slice(0, 60)}…`
            : payload.text,
      });

      void queryClient.invalidateQueries({
        queryKey: messageKey(payload.roomId),
      });
      void queryClient.invalidateQueries({ queryKey: unreadMessagesKey });
    };

    const onRead = (payload: { roomId: string; thread: MessageThreadKey }) => {
      queryClient.setQueryData<MessageThreads>(
        messageKey(payload.roomId),
        (prev) => {
          if (!prev) return prev;
          const t = prev[payload.thread];
          if (!t) return prev;

          return {
            ...prev,
            [payload.thread]: {
              ...t,
              messages: t.messages.map((m) =>
                m.direction === 'out' ? { ...m, read: true } : m,
              ),
            },
          };
        },
      );
    };

    const onReaction = (payload: IncomingReaction) => {
      queryClient.setQueryData<MessageThreads>(
        messageKey(payload.roomId),
        (prev) =>
          patchMessage(prev, payload.thread, payload.id, {
            theirReaction: payload.theirReaction,
          }),
      );
    };

    socket.on('notification', onNotification);
    socket.on('message:received', onMessage);
    socket.on('message:read', onRead);
    socket.on('message:reaction', onReaction);

    return () => {
      socket.off('notification', onNotification);
      socket.off('message:received', onMessage);
      socket.off('message:read', onRead);
      socket.off('message:reaction', onReaction);
    };
  }, [socket, queryClient]);

  return null;
}
