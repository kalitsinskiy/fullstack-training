import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isDisabled = !email || !password;

  return (
    <form className="rounded-card p-card bg-surface w-full max-w-sm shadow-md">
      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Sign in</legend>

        <label htmlFor="login-email" className="font-medium">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />

        <label htmlFor="login-password" className="font-medium">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          minLength={8}
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </fieldset>

      <button
        type="submit"
        disabled={isDisabled}
        className="bg-brand hover:bg-brand-dark disabled:hover:bg-brand mt-4 w-full rounded-md p-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sign In
      </button>
    </form>
  );
}
