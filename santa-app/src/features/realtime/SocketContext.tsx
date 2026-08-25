import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext<SocketContextValue | null>(null);

const WS_URL = import.meta.env.VITE_WS_URL;

const FATAL_ERRORS = ['Authentication token required', 'Invalid or expired token'];

const options = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = tokenStore.get();
    if (!isAuthenticated || !token) return;

    const auth = { token };
    const instance = WS_URL
      ? io(WS_URL, { ...options, auth })
      : io({ ...options, auth });

    instance.on('connect', () => setIsConnected(true));
    instance.on('disconnect', () => setIsConnected(false));
    instance.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
      if (FATAL_ERRORS.includes(error.message)) {
        instance.disconnect();
      }
    });

    socketRef.current = instance;
    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  const value = useMemo(
    () => ({ socket, isConnected, joinRoom, leaveRoom }),
    [socket, isConnected, joinRoom, leaveRoom],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
