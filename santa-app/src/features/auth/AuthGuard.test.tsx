import { screen } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/render';
import { AuthGuard } from './AuthGuard';

const TOKEN_KEY = 'santa.accessToken';

const FAKE_USER = {
  id: 'user-1',
  email: 'alice@test.com',
  displayName: 'Alice',
  role: 'user' as const,
};

beforeEach(() => {
  localStorage.removeItem(TOKEN_KEY);
});

describe('AuthGuard', () => {
  test('redirects unauthenticated user to /login', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<AuthGuard />}>
          <Route path="/rooms" element={<div>Rooms screen</div>} />
        </Route>
      </Routes>,
      { route: '/rooms' },
    );

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Rooms screen')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', async () => {
    localStorage.setItem(TOKEN_KEY, 'fake-token');
    server.use(http.get('/api/users/me', () => HttpResponse.json(FAKE_USER)));

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<AuthGuard />}>
          <Route path="/rooms" element={<div>Rooms screen</div>} />
        </Route>
      </Routes>,
      { route: '/rooms' },
    );

    expect(await screen.findByText('Rooms screen')).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });
});
