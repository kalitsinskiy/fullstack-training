import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { ALICE, tokenFor } from '@/test/msw-server';
import { LocationProbe } from '@/test/LocationProbe';
import { CreateRoomDialog } from './CreateRoomDialog';

describe('CreateRoomDialog', () => {
  test('creates a room and navigates to it', async () => {
    const user = userEvent.setup();
    renderApp(
      <>
        <CreateRoomDialog />
        <LocationProbe />
      </>,
      { route: '/rooms', token: tokenFor(ALICE.email) },
    );

    await user.click(screen.getByRole('button', { name: /create room/i }));
    await user.type(screen.getByLabelText(/room name/i), 'Book Club');
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => expect(screen.getByTestId('pathname')).toHaveTextContent('/rooms/room-new'));
  });
});
