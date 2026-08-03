import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/features/auth/AuthContext';
import { SocketProvider } from '@/features/socket/SocketProvider';
import { tokenStore } from '@/lib/api';

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
});
