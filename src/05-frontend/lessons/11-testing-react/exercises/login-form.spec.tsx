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

/* eslint-disable */
// @ts-nocheck — exercise stub. Remove this directive after implementing.

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
    // TODO: Implement
  });

  // TODO 2: Empty submit → both Zod errors render, onSubmit NOT called
  test('shows validation errors on empty submit and does not call onSubmit', async () => {
    // TODO: Implement
  });

  // TODO 3: Invalid email format → email error, no password error
  test('shows email error when email is invalid but password is OK', async () => {
    // TODO: Implement
  });

  // TODO 4: Valid input → onSubmit called with the parsed data
  test('calls onSubmit with { email, password } on valid submit', async () => {
    // TODO: Implement
  });

  // TODO 5: Rejected onSubmit → message in role="alert"
  test('renders server error message when onSubmit rejects', async () => {
    // TODO: Implement
  });

  // TODO 6: Successful resubmit after error → error disappears
  test('clears server error on a fresh successful submit', async () => {
    // TODO: Implement
  });
});
