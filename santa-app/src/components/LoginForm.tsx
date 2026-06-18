import React, { useState } from "react";
import type ValidationError from "../utils/ValidationError";
import Validate from "../utils/Validation";
import ValidationList from "./ValidationList";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router";

export default function LoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErrors, setEmailErrors] = useState<ValidationError[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValid = email !== "" && password !== "";

  // Where the user was heading before being bounced — fall back to /rooms
  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? "/rooms";

  // If already logged in (e.g. they clicked /login by mistake), bounce to destination
  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailValidationErrors = Validate.email(email);
    const passwordValidationErrors = Validate.password(password);
    setEmailErrors(emailValidationErrors);
    setPasswordErrors(passwordValidationErrors);

    if (
      emailValidationErrors.length > 0 ||
      passwordValidationErrors.length > 0
    ) {
      console.error("validation errors:");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await auth.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="login form"
      className="flex w-80 flex-col gap-3 rounded-lg bg-(--surface) p-4 shadow"
    >
      <h3 className="text-lg font-semibold text-(--text)">Login</h3>

      {submitError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Email</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
        <ValidationList errors={emailErrors} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Password</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          required
        />
        <ValidationList errors={passwordErrors} />
      </label>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="bg-brand hover:bg-brand-dark mt-2 rounded-md px-4 py-2 font-semibold text-(--button-text) transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
