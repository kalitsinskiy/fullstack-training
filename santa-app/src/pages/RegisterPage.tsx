import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { AuthResponse } from '@/types/api';
import { RegisterInput, registerSchema } from '@/schemas/auth';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  async function onSubmit(values: RegisterInput) {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/register', {
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });

      await login(data.accessToken);
      navigate('/rooms', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create your account'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-primary-soft">
            <img src="/decor/santa-hat.svg" alt="" className="size-10" />
          </span>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join Secret Santa and start gifting</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Display name"
              autoComplete="name"
              {...register('displayName')}
              error={errors.displayName?.message}
            />
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
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <FormField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              {...register('confirm')}
              error={errors.confirm?.message}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
