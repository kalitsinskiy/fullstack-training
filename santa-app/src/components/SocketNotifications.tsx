import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';

interface NotificationPayload {
  id: string;
  type: string;
  message: string;
  roomId?: string;
}

function iconFor(type: string): string {
  switch (type) {
    case 'draw.completed': return '🎉';
    case 'user.joined': return '👋';
    case 'wishlist.updated': return '🎁';
    default: return '🔔';
  }
}

export function SocketNotifications() {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: NotificationPayload) => {
      toast(payload.message, { icon: iconFor(payload.type) });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, qc]);

  return null;
}
