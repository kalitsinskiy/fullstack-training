import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocket } from './useSocket';

interface NotificationPayload {
  id: string;
  type: string;
  message: string;
}

function iconFor(type: string): string {
  switch (type) {
    case 'assignment':
      return '🎉';
    case 'wishlist_update':
      return '🎁';
    default:
      return '🔔';
  }
}

// Listens for real-time 'notification' pushes and shows a toast + refreshes the
// notifications cache instantly (so the bell badge updates without polling).
// Mounted once in the authed layout; the global <Toaster/> lives in App.tsx.
export function SocketNotifications() {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: NotificationPayload) => {
      toast(payload.message, { icon: iconFor(payload.type) });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    // Incoming anonymous messages push `message:received` to the recipient. Toast
    // it globally so they're notified anywhere (the open thread also appends it).
    const onMessage = (msg: { roomId: string; text: string }) => {
      toast(msg.text, { icon: '💬', description: 'New anonymous message' });
      void qc.invalidateQueries({ queryKey: ['messages', msg.roomId] });
    };
    socket.on('notification', handler);
    socket.on('message:received', onMessage);
    return () => {
      socket.off('notification', handler);
      socket.off('message:received', onMessage);
    };
  }, [socket, qc]);

  return null;
}
