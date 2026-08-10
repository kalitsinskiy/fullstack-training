import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SocketProvider } from '@/features/socket/SocketProvider';
import { tokenStore } from '@/lib/api';
import { useSocket } from './SocketContext';
import { renderWithProviders } from '@/test/render';

const disconnect = vi.fn();
const ioMock = vi.fn(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect,
  removeAllListeners: vi.fn(),
}));

vi.mock('socket.io-client', () => ({ io: () => ioMock() }));

describe('SocketProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  it('does not connect when unauthenticated', () => {
    render(
      <AuthProvider>
        <SocketProvider>
          <div />
        </SocketProvider>
      </AuthProvider>,
    );
    expect(ioMock).not.toHaveBeenCalled();
  });

  it('exposes the socket to consumers immediately, before connect fires', async () => {
    tokenStore.set('tok');
    let seen: unknown = 'not-rendered';

    function Probe() {
      seen = useSocket().socket;
      return null;
    }

    renderWithProviders(<Probe />);
    await waitFor(() => expect(seen).not.toBeNull());
  });
});
