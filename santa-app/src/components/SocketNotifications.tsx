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

interface IncomingMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
  thread: 'giftee' | 'santa';
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

    const handleIncomingMessage = (msg: IncomingMessage) => {
      if (msg.direction !== 'in') return;
      const from = msg.thread === 'giftee' ? 'Your giftee' : 'Your Secret Santa';
      toast(`${from}: ${msg.text}`, { icon: '💬' });
    };

    socket.on('notification', handleNotification);
    socket.on('message:received', handleIncomingMessage);
    return () => {
      socket.off('notification', handleNotification);
      socket.off('message:received', handleIncomingMessage);
    };
  }, [socket, qc]);

  return null;
}
