import { createContext } from 'react';
import { SocketContextValue } from './SocketProvider';

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});
