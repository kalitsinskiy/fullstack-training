import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Field } from '../ui/Field';
import { LoginSchema, type LoginInput } from '@/schemas/auth';

export function LoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? '/rooms';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  });

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const submit = async (data: LoginInput) => {
    try {
      await auth.login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Login failed',
      });
    }
  };

  return (
    <main className="grid flex-1 place-items-center px-6 pt-16 pb-20">
      <div className="rounded-card bg-card border-border w-full max-w-100 border p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <span className="border-brand/30 text-brand-soft rounded-full border px-[1.1rem] py-[0.45rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
            ● Secret Santa
          </span>
        </div>

        <h2 className="from-brand-dark via-brand-warm to-gradient-end mb-8 bg-linear-to-r bg-clip-text text-center text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-transparent">
          Welcome Back
        </h2>

        {errors.root?.serverError && (
          <div className="rounded-base mb-4 border border-red-200 bg-red-50 px-4 py-3 text-[0.875rem] text-red-700">
            {errors.root.serverError.message}
          </div>
        )}

        <form onSubmit={handleSubmit(submit)} noValidate>
          <fieldset className="mb-5 border-0 p-0">
            <legend className="text-brand-soft float-left mb-2 w-full border-b pb-[0.85rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
              Sign in
            </legend>
            <div className="clear-both" />

            <div className="flex flex-col gap-[1.1rem]">
              <Field
                label="Email"
                type="email"
                placeholder="Valid Email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Field
                label="Password"
                type="password"
                placeholder="Your Password"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={isSubmitting}
            className="mt-5 w-full"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-[0.9rem]">
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
