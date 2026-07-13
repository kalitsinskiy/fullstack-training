// ============================================
// Exercise: LoginForm Tests (RHF + Zod, matches L08)
// ============================================
//
// You're testing a LoginForm built with React Hook Form + Zod —
// the same shape your santa-app LoginForm has after L08.
//
// What the form does (don't modify):
// - Email + Password inputs (Zod schema: valid email, min 8 chars password)
// - "Sign In" submit button
// - On submit: calls props.onSubmit({ email, password })
// - On rejected onSubmit: shows error in role="alert" via setError('root.serverError', …)
// - Per-field validation errors render below each input
//
// Tests to implement (replace each TODO with a real test body):
// 1. Renders email, password, submit button — no alert before first submit
// 2. Empty submit → both Zod errors show, onSubmit NOT called
// 3. Invalid email format → email error shows, password error does NOT
// 4. Valid input → onSubmit called with { email, password }
// 5. Rejected onSubmit → error message rendered in an alert
// 6. Successful resubmit after error → error disappears
//
// Hints:
// - Use userEvent.setup() for interactions
// - Use vi.fn().mockResolvedValue(undefined) / .mockRejectedValue(new Error(...))
// - screen.getByLabelText('Email')
// - screen.getByRole('button', { name: /sign in/i })
// - For async error appearance: await screen.findByText(...) or findByRole('alert')
// - Multiple alerts on screen → use findAllByRole('alert') and pick by text

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schema + Component Under Test (do NOT modify) ----

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type LoginInput = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<void>;
}

function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), mode: 'onSubmit' });

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

      {errors.root?.serverError && <div role="alert">{errors.root.serverError.message}</div>}

      <div>
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" {...register('email')} />
        {errors.email && <span role="alert">{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" {...register('password')} />
        {errors.password && <span role="alert">{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

// ---- Tests — implement each TODO ----

describe('LoginForm', () => {
  // TODO 1: Renders email + password + submit; no alert before first submit
  test('renders email, password, and submit button — no alert initially', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // TODO 2: Empty submit → both Zod errors render, onSubmit NOT called
  test('shows validation errors on empty submit and does not call onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText('Enter a valid email');
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // TODO 3: Invalid email format → email error, no password error
  test('shows email error when email is invalid but password is OK', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText('Enter a valid email');
    expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // TODO 4: Valid input → onSubmit called with the parsed data
  test('calls onSubmit with { email, password } on valid submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      }),
    );
  });

  // TODO 5: Rejected onSubmit → message in role="alert"
  test('renders server error message when onSubmit rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid credentials');
  });

  // TODO 6: Successful resubmit after error → error disappears
  test('clears server error on a fresh successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid credentials'))
      .mockResolvedValueOnce(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
