import { afterEach, describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { renderWithProviders, screen, waitFor } from '@/test/render';
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
 */

// A successful login authenticates the user, which makes SocketProvider open a
// socket.io connection. Stub the client so tests never touch a real transport.
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  }),
}));

const ALICE = {
  id: '665f0c2ab7d13a5e8b1c4d01',
  email: 'alice@test.com',
  displayName: 'Alice',
};

/** Render the login screen with a /rooms route to land on, so we can see the redirect. */
function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/rooms" element={<h1>Your rooms</h1>} />
    </Routes>,
    { route: '/login' },
  );
}

async function signIn(email = 'alice@test.com', password = 'secret123') {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('LoginPage', () => {
  afterEach(() => {
    // `login()` persists the token — clear it so the next test starts anonymous.
    localStorage.clear();
  });

  // ✅ WORKED EXAMPLE — renders with no network call (no token → AuthProvider idle).
  it('renders the email and password fields and a submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits credentials and navigates to /rooms on success', async () => {
    const posted = vi.fn();
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        posted(await request.json());
        return HttpResponse.json({ accessToken: 'test-token' });
      }),
      // login() stores the token, then AuthProvider loads the profile with it.
      http.get('/api/users/me', () => HttpResponse.json(ALICE)),
    );

    renderLogin();
    await signIn();

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({
        email: 'alice@test.com',
        password: 'secret123',
      });
    });

    // The redirect landed us on the rooms screen, and the session was stored.
    expect(
      await screen.findByRole('heading', { name: 'Your rooms' }),
    ).toBeInTheDocument();
    expect(localStorage.getItem('santa.accessToken')).toBe('test-token');
  });

  it('shows an error toast on invalid credentials and stays on the login page', async () => {
    // renderWithProviders does not mount <Toaster/>, so assert on the call.
    const errorToast = vi.spyOn(toast, 'error');
    // NOTE: the api 401 interceptor hard-redirects to /login. jsdom cannot
    // navigate and cannot have `location.assign` stubbed, so it logs
    // "Not implemented: navigation" to stderr here — expected, not a failure.
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 },
        ),
      ),
    );

    renderLogin();
    await signIn('alice@test.com', 'wrong-password');

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Invalid email or password');
    });

    // No redirect, no stored session.
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your rooms' })).not.toBeInTheDocument();
    expect(localStorage.getItem('santa.accessToken')).toBeNull();

    errorToast.mockRestore();
  });

  it('links to the register page', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
