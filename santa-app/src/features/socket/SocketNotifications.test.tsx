import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SocketContext } from '@/features/socket/SocketContext';
import { SocketNotifications } from '@/features/socket/SocketNotifications';
import { createMockSocket } from '@/test/mockSocket';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe('SocketNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toasts and invalidates notifications on a notification event', () => {
    const { socket, server } = createMockSocket();
    const qc = new QueryClient();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');

    render(
      <QueryClientProvider client={qc}>
        <SocketContext.Provider
          value={{
            socket: socket as never,
            isConnected: true,
            joinRoom: () => {},
            leaveRoom: () => {},
          }}
        >
          <SocketNotifications />
        </SocketContext.Provider>
      </QueryClientProvider>,
    );

    server('notification', {
      id: 'n1',
      type: 'draw.completed',
      message: 'The draw is complete!',
    });

    expect(toast).toHaveBeenCalledWith('The draw is complete!', { icon: '🎉' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });

  it('toasts on an incoming anonymous message', () => {
    const { socket, server: fire } = createMockSocket();
    const qc = new QueryClient();

    render(
      <QueryClientProvider client={qc}>
        <SocketContext.Provider
          value={{
            socket: socket as never,
            isConnected: true,
            joinRoom: () => {},
            leaveRoom: () => {},
          }}
        >
          <SocketNotifications />
        </SocketContext.Provider>
      </QueryClientProvider>,
    );

    fire('message:received', {
      id: 'm1',
      roomId: 'r1',
      text: 'test',
      createdAt: new Date().toISOString(),
      direction: 'in',
      thread: 'giftee',
    });

    expect(toast).toHaveBeenCalledWith(
      'New anonymous message 💬',
      expect.objectContaining({ description: 'test' }),
    );
  });
});
