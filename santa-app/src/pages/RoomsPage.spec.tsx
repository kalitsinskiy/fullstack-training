import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/msw-server';
import { RoomsPage } from './RoomsPage';

const BASE = 'http://localhost:3001';
const meta = { total: 0, page: 1, limit: 10, totalPage: 1 };

describe('RoomsPage', () => {
  test('shows a loading spinner initially', () => {
    renderApp(<RoomsPage />, { route: '/rooms', authed: true });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders the rooms from the API once loaded', async () => {
    renderApp(<RoomsPage />, { route: '/rooms', authed: true });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test('shows the empty state when the API returns no rooms', async () => {
    server.use(http.get(`${BASE}/api/rooms`, () => HttpResponse.json({ data: [], meta })));

    renderApp(<RoomsPage />, { route: '/rooms', authed: true });

    expect(await screen.findByText(/no rooms yet/i)).toBeInTheDocument();
  });

  test('shows an error message when the fetch fails', async () => {
    server.use(
      http.get(`${BASE}/api/rooms`, () => HttpResponse.json({ message: 'Ooops' }, { status: 500 }))
    );

    renderApp(<RoomsPage />, { route: '/rooms', authed: true });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
