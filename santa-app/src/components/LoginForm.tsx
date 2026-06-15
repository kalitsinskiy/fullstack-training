import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validateEmail(value: string) {
    if (!value.trim()) return "Email is required";
    if (!value.includes("@") || !value.includes("."))
      return "Enter a valid email";
    return null;
  }

  function validatePassword(value: string) {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  const hasErrors = !!emailError || !!passwordError;
  const isEmpty = !email.trim() || !password.trim();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await auth.login(email, password);
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card flex w-full max-w-sm flex-col gap-4 bg-white shadow-sm"
    >
      <h2 className="text-brand text-xl font-semibold">Sign In</h2>

      {submitError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="login-email"
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
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="you@example.com"
        />
        {emailError && <p className="text-xs text-red-500">{emailError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="login-password"
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
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
        />
        {passwordError && (
          <p className="text-xs text-red-500">{passwordError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={hasErrors || isEmpty || submitting}
        className={clsx(
          "rounded px-4 py-2 text-sm font-medium text-white transition-colors",
          hasErrors || isEmpty || submitting
            ? "bg-brand/50 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        {submitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
