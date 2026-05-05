// ============================================
// Form Test Example — RHF + Zod (matches Lesson 08)
// ============================================
// Tests a LoginForm built with React Hook Form + Zod (the L08 stack).
// What we test: validation errors render, submit handler called with valid
// data, server error from rejected onSubmit appears in role="alert".
//
// What we deliberately DON'T test:
//   - That register() wires onChange (RHF's job)
//   - That zodResolver maps Zod issues to RHF errors (RHF + resolver's job)
//   - That isSubmitting flips while the promise is pending (RHF internal)
//   We test the *user-visible behavior* — same tests would pass if you
//   refactored to a different form lib tomorrow.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schema (the same shape your real LoginForm uses) ----

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type LoginInput = z.infer<typeof LoginSchema>;

// ---- Component Under Test ----

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<void>;
}

function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onSubmit',
  });

  const submit = async (data: LoginInput) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Login failed',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <h2>Sign in</h2>

      {errors.root?.serverError && (
        <div role="alert">{errors.root.serverError.message}</div>
      )}

      <div>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id="login-email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          aria-invalid={!!errors.password || undefined}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <span id="login-password-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

// ---- Tests ----

describe('LoginForm (RHF + Zod)', () => {
  test('renders email, password, and submit button', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // No error banner before any submit attempt
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows Zod validation errors on empty submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Both field errors render — coming from Zod, surfaced via RHF formState
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    // Handler must NOT be called for invalid input
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows email error for invalid format, password OK', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  test('calls onSubmit with parsed data when fields are valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'alice@test.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'alice@test.com',
        password: 'SecretPass1',
      });
    });
  });

  test('renders server error from a rejected onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'alice@test.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // The first alert in the form is the root.serverError banner
    const alerts = await screen.findAllByRole('alert');
    expect(alerts[0]).toHaveTextContent(/invalid credentials/i);
  });

  test('clears server error on a fresh successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid credentials'))
      .mockResolvedValueOnce(undefined);

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'alice@test.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });
  });
});
