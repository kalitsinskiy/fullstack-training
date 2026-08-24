import { useContext } from 'react';
import { SocketContextValue } from './SocketProvider';
import { SocketContext } from './SocketContext';

export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
