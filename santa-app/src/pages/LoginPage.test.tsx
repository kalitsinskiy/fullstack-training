import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { LoginPage } from './LoginPage';

/**
 * COMPONENT TEST (React Testing Library + MSW) — the approach for the frontend.
 *
 * We render a page inside the real providers (see src/test/render.tsx) and
 * interact with it the way a user would — query by role/label, type, click —
 * then assert what the user sees. Network calls are intercepted by MSW
 * (src/test/mocks), so no real backend is needed.
 */
describe('LoginPage', () => {
  // ✅ WORKED EXAMPLE — renders with no network call (no token → AuthProvider idle).
  it('renders the email and password fields and a submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits credentials and navigates to /rooms on success', async () => {
    // default handler (mocks/handlers.ts) returns { accessToken } for POST /api/auth/login
    renderWithProviders(
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Routes>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Rooms screen')).toBeInTheDocument();
  });

  it('stays on the login page on invalid credentials (401)', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Routes>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // No redirect — we never reach the rooms screen; the form is still shown.
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText('Rooms screen')).not.toBeInTheDocument();
  });

  it('links to the register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });
});
