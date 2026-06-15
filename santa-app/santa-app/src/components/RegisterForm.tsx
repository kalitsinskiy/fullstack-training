import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isDisabled = !name || !email || !password || !confirmPassword;

  return (
    <form className="rounded-card p-card bg-surface w-full max-w-sm shadow-md">
      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">
          Account details
        </legend>

        <label htmlFor="register-name" className="font-medium">
          Full Name
        </label>
        <input
          id="register-name"
          type="text"
          required
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />

        <label htmlFor="register-email" className="font-medium">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />

        <label htmlFor="register-password" className="font-medium">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />

        <label htmlFor="register-confirm-password" className="font-medium">
          Confirm Password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          required
          minLength={8}
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </fieldset>

      <button
        type="submit"
        disabled={isDisabled}
        className="bg-brand hover:bg-brand-dark disabled:hover:bg-brand mt-4 w-full rounded-md p-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Account
      </button>
    </form>
  );
}
