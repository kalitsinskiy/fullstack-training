import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';
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
 *
 * LoginPage is the worked-example screen, so the first test is fully written.
 * The rest are `it.todo` — implement them as you build out each screen.
 */

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/rooms" element={<div>Rooms dashboard</div>} />
      <Route path="/register" element={<div>Register page</div>} />
    </Routes>,
    { route: '/login' },
  );
}

describe('LoginPage', () => {
  // ✅ WORKED EXAMPLE — renders with no network call (no token → AuthProvider idle).
  it('renders the email and password fields and a submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('validates the email format before submitting', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  // 👇 Turn these into real tests with userEvent + MSW handlers.
  it('submits credentials and navigates to /rooms on success (MSW: POST /api/auth/login → token)', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Rooms dashboard')).toBeInTheDocument();
  });

  it('shows an error toast on invalid credentials (MSW: 401)', async () => {
    const errorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { statusCode: 401, message: 'Invalid email or password' },
          { status: 401 },
        ),
      ),
    );

    setup();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await vi.waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith('Invalid email or password'),
    );
  });

  it('links to the register page', async () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'Create one' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Create one' }));

    expect(await screen.findByText('Register page')).toBeInTheDocument();
  });
});
