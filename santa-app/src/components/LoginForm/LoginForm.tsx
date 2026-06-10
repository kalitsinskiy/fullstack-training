import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { inputValidation } from '../../utils/validators';

export function LoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? '/rooms';

  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const isDisabled = !fields.email || !fields.password || !!errors.email || !!errors.password;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: inputValidation(name as 'email' | 'password', value),
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isDisabled) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      await auth.login(fields.email, fields.password);

      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid flex-1 place-items-center px-6 pt-16 pb-20">
      <div className="rounded-card bg-surface border-edge w-full max-w-100 border p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <span className="border-brand/30 text-brand-soft rounded-full border px-[1.1rem] py-[0.45rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
            ● Secret Santa
          </span>
        </div>

        <h2 className="from-brand-dark via-brand-warm to-gradient-end mb-8 bg-linear-to-r bg-clip-text text-center text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-transparent">
          Welcome Back
        </h2>

        {submitError && (
          <div className="rounded-base mb-4 border border-red-200 bg-red-50 px-4 py-3 text-[0.875rem] text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="mb-5 border-0 p-0">
            <legend className="text-brand-soft border-b-edge float-left mb-2 w-full border-b pb-[0.85rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
              Sign in
            </legend>
            <div className="clear-both" />

            <div className="flex flex-col gap-[1.1rem]">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Valid Email"
                required
                value={fields.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Your Password"
                minLength={8}
                required
                value={fields.password}
                onChange={handleChange}
                error={errors.password}
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            variant="primary"
            disabled={isDisabled || submitting}
            className="mt-5 w-full"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="text-subdued mt-6 text-center text-[0.9rem]">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-soft hover:text-brand-warm font-semibold">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
