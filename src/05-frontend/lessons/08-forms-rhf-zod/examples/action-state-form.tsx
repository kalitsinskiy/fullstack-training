/**
 * useActionState — React 19 form actions
 *
 * Same login form as login-form.tsx, but using React 19's native form action API
 * instead of React Hook Form. The action function receives (previousState, formData)
 * and returns the next state. React handles the submission as a transition.
 *
 * When to prefer this:
 *   - The form maps cleanly to a backend endpoint or server action
 *   - You want progressive enhancement (works without JS — important for SSR)
 *   - You're on Next.js / Remix / a framework with server actions
 *
 * When NOT to prefer it (and reach for RHF + Zod instead):
 *   - Heavy interactive validation (live feedback as user types)
 *   - Dynamic field arrays
 *   - Complex cross-field rules with instant feedback
 *
 * For an SPA like santa-app, RHF + Zod stays the default.
 *
 * Requires React 19. Run by importing <ActionStateDemo /> into a Vite + React 19 app.
 */

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';

// ---- Schema (reused from login-form.tsx) ----

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

// ---- State shape ----

interface State {
  fieldErrors: Partial<Record<'email' | 'password', string[]>> | null;
  formError: string | null;
  success: boolean;
}

const initialState: State = { fieldErrors: null, formError: null, success: false };

// ---- The action ----

async function loginAction(_prev: State, formData: FormData): Promise<State> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: null,
      success: false,
    };
  }

  // Pretend to call the API
  await new Promise((r) => setTimeout(r, 500));
  if (Math.random() < 0.4) {
    return { fieldErrors: null, formError: 'Invalid credentials', success: false };
  }

  return { fieldErrors: null, formError: null, success: true };
}

// ---- Submit button — uses useFormStatus to read the parent form's pending state ----

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  );
}

// ---- Component ----

export default function ActionStateDemo() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 360 }}>
      <h2>Sign in (React 19 form actions)</h2>

      {state.success && (
        <div role="status" style={{ background: '#dcfce7', color: '#166534', padding: 8, borderRadius: 4 }}>
          Logged in successfully.
        </div>
      )}

      {state.formError && (
        <div role="alert" style={{ background: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 4 }}>
          {state.formError}
        </div>
      )}

      <form action={formAction} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" />
          {state.fieldErrors?.email && (
            <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
              {state.fieldErrors.email[0]}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" />
          {state.fieldErrors?.password && (
            <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
              {state.fieldErrors.password[0]}
            </span>
          )}
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
