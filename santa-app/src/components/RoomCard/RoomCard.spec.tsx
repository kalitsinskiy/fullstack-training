import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Room } from '@/types/api';
import { RoomCard } from './RoomCard';

const baseRoom: Room = {
  id: 'r1',
  name: 'Office Party',
  ownerId: 'u1',
  code: 'ABC123',
  members: ['u1', 'u2'],
  status: 'pending',
  exchangePlace: '',
  createdAt: '2026-06-06T00:00:00.000Z',
};

describe('RoomCard', () => {
  test('renders name, code, participant count', () => {
    render(<RoomCard room={baseRoom} />);

    expect(screen.getByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('2 participants')).toBeInTheDocument();
  });

  test.each([
    ['pending', 'Pending'],
    ['drawn', 'Drawn'],
    ['closed', 'Closed'],
  ] as const)('shows the %s status badge', (status, label) => {
    render(<RoomCard room={{ ...baseRoom, status }} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test('calls onOpen when View is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(<RoomCard room={baseRoom} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /view/i }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
