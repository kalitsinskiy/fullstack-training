import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';
import { IncomingMessage } from '@/types/api';
import { messageKey, unreadMessagesKey } from '../messages/hooks';

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
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

    socket.on('notification', onNotification);
    socket.on('message:received', onMessage);

    return () => {
      socket.off('notification', onNotification);
      socket.off('message:received', onMessage);
    };
  }, [socket, queryClient]);

  return null;
}
