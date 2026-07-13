import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { ErrorBoundary } from 'react-error-boundary';
import { renderApp } from '@/test/renderApp';
import { server, API_URL, ALICE, ROOM_OFFICE, ROOM_FAMILY, tokenFor } from '@/test/msw-server';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LocationProbe } from '@/test/LocationProbe';
import { RoomsPage } from './RoomsPage';

describe('RoomsPage', () => {
  test('shows a loading state while rooms are being fetched', () => {
    renderApp(<RoomsPage />, { route: '/rooms', token: tokenFor(ALICE.email) });

    expect(screen.getByText(/loading rooms/i)).toBeInTheDocument();
  });

  test('renders the fetched room list', async () => {
    renderApp(<RoomsPage />, { route: '/rooms', token: tokenFor(ALICE.email) });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.getByText('Family Exchange')).toBeInTheDocument();
  });

  test('shows an empty state when there are no rooms', async () => {
    server.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } }),
      ),
    );

    renderApp(<RoomsPage />, { route: '/rooms', token: tokenFor(ALICE.email) });

    expect(await screen.findByText(/haven't joined any rooms yet/i)).toBeInTheDocument();
  });

  test('an unexpected fetch failure is caught by the error boundary', async () => {
    // Non-ApiError failures aren't "expected" (see queryClient's throwOnError),
    // so React Query throws during render — this is caught by the same
    // ErrorBoundary that wraps RoomsPage inside Layout in the real app.
    server.use(http.get(`${API_URL}/api/rooms`, () => HttpResponse.error()));

    renderApp(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <RoomsPage />
      </ErrorBoundary>,
      { route: '/rooms', token: tokenFor(ALICE.email) },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });

  test('joining a room invalidates the rooms cache and navigates to the room', async () => {
    let roomsFetchCount = 0;
    server.use(
      http.get(`${API_URL}/api/rooms`, () => {
        roomsFetchCount += 1;
        return HttpResponse.json({
          data: [ROOM_OFFICE, ROOM_FAMILY],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(
      <>
        <RoomsPage />
        <LocationProbe />
      </>,
      { route: '/rooms', token: tokenFor(ALICE.email) },
    );

    await screen.findByText('Office Party');
    expect(roomsFetchCount).toBe(1);

    await user.click(screen.getByRole('button', { name: /join a room/i }));
    const codeInput = screen.getByLabelText(/invite code/i);
    await user.type(codeInput, ROOM_OFFICE.inviteCode);

    // Disambiguate from the "Join" button on the room card below the form.
    const form = codeInput.closest('form')!;
    await user.click(within(form).getByRole('button', { name: /^join$/i }));

    await waitFor(() =>
      expect(screen.getByTestId('pathname')).toHaveTextContent(`/rooms/${ROOM_OFFICE._id}`),
    );
    await waitFor(() => expect(roomsFetchCount).toBeGreaterThan(1));
  });
});
