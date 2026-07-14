import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { RegisterPage } from './RegisterPage';

describe('RegisterPage', () => {
  // Renders with no network call (no token → AuthProvider idle).
  it('renders the display name, email and password fields and a submit button', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  // 👇 Turn these into real tests with userEvent + MSW handlers.
  it.todo(
    'submits the form and logs in on success (MSW: POST /api/auth/register → token)',
  );
  it.todo(
    'shows an error toast when the email is already registered (MSW: 409)',
  );
  it.todo('links to the login page');
});
