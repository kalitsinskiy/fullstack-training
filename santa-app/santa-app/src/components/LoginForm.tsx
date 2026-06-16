import { useState, type SyntheticEvent } from "react";

function validateEmail(value: string): string | null {
  if (!value) return "Email is required";
  if (!value.includes("@") || !value.includes(".")) return "Enter a valid email address";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    console.log("Login payload:", { email, password });
  };

  const isDisabled = !email || !password || !!emailError || !!passwordError;

  const inputClass =
    "focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card bg-surface w-full max-w-sm shadow-md"
    >
      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Sign in</legend>

        <label htmlFor="login-email" className="font-medium">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={(e) => setEmailError(validateEmail(e.target.value))}
          className={inputClass}
        />
        {emailError && <p className="text-danger text-sm">{emailError}</p>}

        <label htmlFor="login-password" className="font-medium">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
          className={inputClass}
        />
        {passwordError && <p className="text-danger text-sm">{passwordError}</p>}
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
