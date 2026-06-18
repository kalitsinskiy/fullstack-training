import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Field } from '../ui/Field';
import { RegisterSchema, type RegisterInput } from '@/schemas/auth';
import { FormError } from '../ui/FormError';
import { AuthCard } from '../AuthCard';

export function RegisterForm() {
  const auth = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onBlur',
  });

  const submit = async (data: RegisterInput) => {
    try {
      await auth.register(data.email, data.password, data.displayName);
      navigate('/login');
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  };

  return (
    <AuthCard title="Create Account">
      <FormError>{errors.root?.serverError.message}</FormError>

      <form onSubmit={handleSubmit(submit)}>
        <fieldset className="mb-5 border-0 p-0">
          <legend className="text-brand-soft float-left mb-2 w-full border-b pb-[0.85rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
            Account details
          </legend>
          <div className="clear-both" />
          <div className="flex flex-col gap-[1.1rem]">
            <Field
              label="Name"
              type="text"
              placeholder="Display Name"
              {...register('displayName')}
              error={errors.displayName?.message}
            />
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
              placeholder="Password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Field
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              {...register('confirm')}
              error={errors.confirm?.message}
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
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </Button>
        <p className="text-muted-foreground mt-6 text-center text-[0.9rem]">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-soft hover:text-brand-warm font-semibold">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
