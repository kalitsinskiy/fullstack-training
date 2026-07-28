import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { SocketContext } from './SocketContext';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(import.meta.env.VITE_WS_URL || undefined, {
      auth: { token: tokenStore.get() },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      if (err.message === 'Invalid or expired token') {
        socket.disconnect();
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
      joinRoom: (roomId: string) =>
        socketRef.current?.emit('join-room', roomId),
      leaveRoom: (roomId: string) =>
        socketRef.current?.emit('leave-room', roomId),
    }),
    [isConnected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
