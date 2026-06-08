import { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { inputValidation } from '../../utils/validators';

export function RegisterForm() {
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const isDisabled =
    !fields.name ||
    !fields.email ||
    !fields.password ||
    !fields.confirmPassword ||
    !!errors.name ||
    !!errors.email ||
    !!errors.password ||
    !!errors.confirmPassword;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: inputValidation(
        name as 'name' | 'email' | 'password' | 'confirmPassword',
        value,
        name === 'confirmPassword' ? fields.password : undefined
      ),
    }));
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isDisabled) return;

    console.log('Login payload:', fields);
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
          Create Account
        </h2>
        <form onSubmit={handleSubmit}>
          <fieldset className="mb-5 border-0 p-0">
            <legend className="text-brand-soft border-b-edge float-left mb-2 w-full border-b pb-[0.85rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
              Account details
            </legend>
            <div className="clear-both" />
            <div className="flex flex-col gap-[1.1rem]">
              <Input
                label="Name"
                name="name"
                type="text"
                placeholder="Display Name"
                required
                value={fields.name}
                error={errors.name}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Valid Email"
                required
                value={fields.email}
                error={errors.email}
                onChange={handleChange}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Password"
                minLength={8}
                required
                value={fields.password}
                error={errors.password}
                onChange={handleChange}
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                minLength={8}
                required
                value={fields.confirmPassword}
                error={errors.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </fieldset>
          <Button type="submit" variant="primary" disabled={isDisabled} className="mt-5 w-full">
            Create Account
          </Button>
          <p className="text-subdued mt-6 text-center text-[0.9rem]">
            Already have an account?{' '}
            <a href="/login" className="text-brand-soft hover:text-brand-warm font-semibold">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
