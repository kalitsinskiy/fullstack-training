import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { CreateRoomDialog } from './CreateRoomDialog';

function setup() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/rooms"
        element={<CreateRoomDialog open onOpenChange={() => {}} />}
      />
      <Route path="/rooms/:id" element={<div>Room detail</div>} />
    </Routes>,
    { route: '/rooms' },
  );
}

describe('CreateRoomDialog', () => {
  it('blocks submit when the name is too short', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/room name/i), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText(/at least 3 characters/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Room detail')).not.toBeInTheDocument();
  });

  it('creates a room and navigates to its detail page', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/room name/i), 'Office Party');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Room detail')).toBeInTheDocument();
  });
});
