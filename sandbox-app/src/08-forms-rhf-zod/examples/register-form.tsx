/**
 * RegisterForm — confirm-password + async username availability check
 *
 * Demonstrates:
 *   - schema `.refine(...)` for cross-field validation (passwords match)
 *   - async validation per field via `register('username', { validate: async … })`
 *   - resetting/clearing errors
 *
 * Run by importing <RegisterFormDemo /> from a Vite app.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schema ----

const RegisterSchema = z
  .object({
    username: z.string().min(3, 'At least 3 characters').max(20),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type RegisterInput = z.infer<typeof RegisterSchema>;

// ---- Fake "username taken" API ----

const takenUsernames = new Set(['admin', 'root', 'alice']);

async function checkUsername(name: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 400));
  return !takenUsernames.has(name.toLowerCase());
}

// ---- Component ----

export default function RegisterFormDemo() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onBlur',
  });

  const submit = async (data: RegisterInput) => {
    await new Promise((r) => setTimeout(r, 300));
    alert(`Registered as ${data.username} (${data.email})`);
    reset();
  };

  const fieldStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 8, marginTop: 4 };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      style={{ display: 'grid', gap: 12, maxWidth: 400, padding: 24, fontFamily: 'system-ui, sans-serif' }}
    >
      <h2>Create account</h2>

      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          autoComplete="username"
          style={fieldStyle}
          {...register('username', {
            validate: async (value) => {
              if (value.length < 3) return true; // schema handles short
              const ok = await checkUsername(value);
              return ok || 'This username is already taken';
            },
          })}
        />
        {errors.username && (
          <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
            {errors.username.message}
          </span>
        )}
        <p style={{ fontSize: 12, color: '#666' }}>Try: admin, root, alice (taken)</p>
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" style={fieldStyle} {...register('email')} />
        {errors.email && (
          <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          style={fieldStyle}
          {...register('password')}
        />
        {errors.password && (
          <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
            {errors.password.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="confirm">Confirm password</label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          style={fieldStyle}
          {...register('confirm')}
        />
        {errors.confirm && (
          <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
            {errors.confirm.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
