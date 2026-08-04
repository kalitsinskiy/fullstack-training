import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { JoinRoomDialog } from './JoinRoomDialog';
import { Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

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
  it('opens the joined room after valid code is entered and submitted', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders(
      <Routes>
        <Route
          path="/rooms"
          element={<JoinRoomDialog open onOpenChange={onOpenChange} />}
        />
        <Route path="/rooms/:id" element={<div>Room detailed page</div>} />
      </Routes>,
      { route: '/rooms' },
    );

    await userEvent.type(screen.getByLabelText(/invite code/i), 'ABC123');
    await userEvent.click(screen.getByRole('button', { name: /^join$/i }));

    expect(await screen.findByText('Room detailed page')).toBeInTheDocument();

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('shows an error toast when the code is rejected', async () => {
    const errorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/rooms/join', () =>
        HttpResponse.json(
          { statusCode: 400, message: 'Invalid invite code' },
          { status: 400 },
        ),
      ),
    );

    renderWithProviders(<JoinRoomDialog open onOpenChange={() => {}} />, {
      route: '/rooms',
    });

    await userEvent.type(screen.getByLabelText(/invite code/i), 'ZZZ123');
    await userEvent.click(screen.getByRole('button', { name: /^join$/i }));

    await vi.waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith('Invalid invite code'),
    );
  });
});
