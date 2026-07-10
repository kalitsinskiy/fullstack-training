import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { JoinRoomDialog } from './JoinRoomDialog';

describe('JoinRoomDialog', () => {
  it('requires a 6-character code', async () => {
    renderWithProviders(<JoinRoomDialog open onOpenChange={() => {}} />, {
      route: '/rooms',
    });
    await userEvent.type(screen.getByLabelText(/invite code/i), 'AB12');
    await userEvent.click(screen.getByRole('button', { name: /^join$/i }));
    expect(await screen.findByText(/6-character code/i)).toBeInTheDocument();
  });

  // Lesson 05
  it.todo('opens the joined room after valid code is entered and submitted');
});
