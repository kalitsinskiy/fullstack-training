import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketContext';

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

    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
    };
  }, [socket, queryClient]);

  return null;
}
