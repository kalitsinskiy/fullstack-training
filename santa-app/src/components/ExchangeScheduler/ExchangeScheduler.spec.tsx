import { describe, test, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/msw-server';
import { ExchangeScheduler } from './ExchangeScheduler';
import type { Room } from '@/types/api';

const BASE = 'http://localhost:3001';

const baseRoom: Room = {
  id: 'r1',
  name: 'Office Party',
  ownerId: 'u1',
  code: 'ABC123',
  members: ['u1'],
  status: 'drawn',
  exchangePlace: '',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ExchangeScheduler', () => {
  test('prefills from the room and labels the button "Update exchange" when a date exists', () => {
    const room = {
      ...baseRoom,
      exchangeDate: '2026-12-24T18:00:00.000Z',
      exchangePlace: 'Room 220, 2nd floor',
    };
    renderApp(<ExchangeScheduler room={room} />);

    expect(screen.getByLabelText('Place')).toHaveValue('Room 220, 2nd floor');
    expect(screen.getByRole('button', { name: /update exchange/i })).toBeInTheDocument();
  });

  test('labels the button "Set exchange" when no date is set yet', () => {
    renderApp(<ExchangeScheduler room={baseRoom} />);
    expect(screen.getByRole('button', { name: /set exchange/i })).toBeInTheDocument();
  });

  test('shows Zod errors when submitting empty', async () => {
    const user = userEvent.setup();
    renderApp(<ExchangeScheduler room={baseRoom} />);

    await user.click(screen.getByRole('button', { name: /set exchange/i }));

    expect(await screen.findByText(/pick a date & time/i)).toBeInTheDocument();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  test('valid submit PATCHes the room with an ISO date + place', async () => {
    const user = userEvent.setup();
    let patched: { exchangeDate: string; exchangePlace: string } | undefined;

    server.use(
      http.patch(`${BASE}/api/rooms/:id`, async ({ request }) => {
        patched = (await request.json()) as typeof patched;
        return HttpResponse.json({ ...baseRoom, ...patched });
      })
    );

    const room = { ...baseRoom, exchangeDate: '2026-12-24T18:00:00.000Z', exchangePlace: 'Old' };
    renderApp(<ExchangeScheduler room={room} />);

    await user.clear(screen.getByLabelText('Place'));
    await user.type(screen.getByLabelText('Place'), 'Room 220, 2nd floor');
    await user.click(screen.getByRole('button', { name: /update exchange/i }));

    await waitFor(() => {
      expect(patched?.exchangePlace).toBe('Room 220, 2nd floor');
      expect(patched?.exchangeDate).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
    });
  });
});
