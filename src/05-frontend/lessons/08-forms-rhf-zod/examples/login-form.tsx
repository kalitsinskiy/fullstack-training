/**
 * LoginForm — React Hook Form + Zod
 *
 * The full picture:
 * - schema-defined validation (Zod)
 * - typed inputs from `z.infer`
 * - server-error mapping via setError('root.serverError', …)
 * - isSubmitting from formState (no manual loading boolean)
 * - accessible labels + aria-invalid + aria-describedby
 *
 * To run:
 *   npm install react-hook-form @hookform/resolvers zod
 *   Copy this file into your Vite app, render <LoginFormDemo /> in App.tsx.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schema ----

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

type LoginInput = z.infer<typeof LoginSchema>;

// ---- Component ----

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  });

  const submit = async (data: LoginInput) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root.serverError', { message: (err as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <h2>Sign in</h2>

      {errors.root?.serverError && (
        <div role="alert" style={{ color: '#b91c1c', background: '#fee2e2', padding: 8, borderRadius: 4 }}>
          {errors.root.serverError.message}
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          style={{ display: 'block', width: '100%', padding: 8 }}
          {...register('email')}
        />
        {errors.email && (
          <span id="email-error" role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          style={{ display: 'block', width: '100%', padding: 8 }}
          {...register('password')}
        />
        {errors.password && (
          <span id="password-error" role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
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

// ---- Demo ----

export default function LoginFormDemo() {
  // Fake auth: 50% success, 50% failure
  const fakeLogin = async (data: LoginInput): Promise<void> => {
    await new Promise((r) => setTimeout(r, 500));
    if (Math.random() < 0.5) throw new Error('Invalid credentials');
    console.log('Logged in as:', data.email);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <LoginForm onSubmit={fakeLogin} />
    </div>
  );
}
