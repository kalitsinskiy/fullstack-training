import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { SocketContext } from './SocketContext';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const next = io(import.meta.env.VITE_WS_URL || undefined, {
      auth: { token: tokenStore.get() },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(next);

    next.on('connect', () => setIsConnected(true));
    next.on('disconnect', () => setIsConnected(false));
    next.on('connect_error', (err) => {
      if (err.message === 'Invalid or expired token') {
        next.disconnect();
        logout();
      }
    });

    return () => {
      next.removeAllListeners();
      next.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, logout]);

  const joinRoom = useCallback(
    (roomId: string) => socket?.emit('join-room', roomId),
    [socket],
  );

  const leaveRoom = useCallback(
    (roomId: string) => socket?.emit('leave-room', roomId),
    [socket],
  );

  const value = useMemo(
    () => ({ socket, isConnected, joinRoom, leaveRoom }),
    [socket, isConnected, joinRoom, leaveRoom],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
