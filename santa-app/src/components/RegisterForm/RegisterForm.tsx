import { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isDisabled = !name || !email || !password || !confirmPassword;

  return (
    <main className="grid flex-1 place-items-center px-6 pt-16 pb-20">
      <div className="rounded-card bg-surface w-full max-w-100 border border-edge p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <span className="border-brand/30 text-brand-soft rounded-full border px-[1.1rem] py-[0.45rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
            ● Secret Santa
          </span>
        </div>
        <h2 className="from-brand-dark via-brand-warm mb-8 bg-linear-to-r to-gradient-end bg-clip-text text-center text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-transparent">
          Create Account
        </h2>
        <form>
          <fieldset className="mb-5 border-0 p-0">
            <legend className="text-brand-soft float-left mb-2 w-full border-b border-b-edge pb-[0.85rem] text-[0.7rem] font-bold tracking-[0.25em] uppercase">
              Account details
            </legend>
            <div className="clear-both" />
            <div className="flex flex-col gap-[1.1rem]">
              <Input
                label="Name"
                name="displayName"
                type="text"
                placeholder="Display Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Valid Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                name="passwordConfirm"
                type="password"
                placeholder="Confirm password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
