import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
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
describe('LoginPage', () => {
  // ✅ WORKED EXAMPLE — renders with no network call (no token → AuthProvider idle).
  it('renders the email and password fields and a submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // 👇 Turn these into real tests with userEvent + MSW handlers.
  it.todo('submits credentials and navigates to /rooms on success (MSW: POST /api/auth/login → token)');
  it.todo('shows an error toast on invalid credentials (MSW: 401)');
  it.todo('links to the register page');
});
