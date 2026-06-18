import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Field } from '../ui/Field';
import { LoginSchema, type LoginInput } from '@/schemas/auth';
import { FormError } from '../ui/FormError';
import { AuthCard } from '../AuthCard';

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
    <AuthCard title="Welcome Back">
      <FormError>{errors.root?.serverError?.message}</FormError>

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
    </AuthCard>
  );
}
