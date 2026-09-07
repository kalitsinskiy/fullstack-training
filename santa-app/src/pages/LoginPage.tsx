import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginSchema, type LoginInput } from '@/schemas/auth';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { AuthResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/rooms';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  });

  async function onSubmit(values: LoginInput) {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', values);
      await login(data.accessToken);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Invalid email or password'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-primary-soft">
            <img src="/decor/santa-hat.svg" alt="" className="size-10" />
          </span>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Secret Santa account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
