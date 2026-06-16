import { useState } from "react";
import { clsx } from "clsx";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function validateEmail(value: string): string | null {
    if (!value.trim()) return "Email is required";
    if (!value.includes("@") || !value.includes("."))
      return "Enter a valid email";
    return null;
  }

  function validatePassword(value: string): string | null {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  const hasErrors =
    !!emailError || !!passwordError || !email.trim() || !password;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;
    console.log("Login:", { email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card bg-surface p-card mx-auto w-full max-w-sm shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Sign In</h2>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="login-email"
          className="text-text-muted text-sm font-medium"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailError(validateEmail(email))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {emailError && <p className="text-danger text-xs">{emailError}</p>}
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <label
          htmlFor="login-password"
          className="text-text-muted text-sm font-medium"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordError(validatePassword(password))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {passwordError && (
          <p className="text-danger text-xs">{passwordError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={hasErrors}
        className={clsx(
          "w-full rounded-md px-4 py-2 font-medium text-white transition-colors",
          "focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          hasErrors
            ? "bg-brand/40 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        Sign In
      </button>
    </form>
  );
}
