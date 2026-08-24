import { useSocketContext } from '@/features/socket/useSocketContext';

export function useSocket() {
  // joinRoom/leaveRoom come from the provider, which tracks memberships and
  // replays them on every reconnect so room:* events survive a connection blip.
  const { socket, isConnected, joinRoom, leaveRoom } = useSocketContext();

  return { socket, isConnected, joinRoom, leaveRoom };
}
