import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';

// Empty VITE_WS_URL = use the same origin (Vite proxies /socket.io to the
// notifications service). socket.io needs `undefined` for that, not '' — an
// empty string fails to connect, which silently kills live notifications.
const SOCKET_URL = import.meta.env.VITE_WS_URL || undefined;

const SocketContext = createContext<Socket | null>(null);

// One shared Socket.IO connection for the whole authed app. Mount once; every
// consumer reads the same socket via useSocket() (no per-component connections).
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
