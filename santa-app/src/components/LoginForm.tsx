import React, { useState } from "react";
import type ValidationError from "../utils/ValidationError";
import Validate from "../utils/Validation";
import ValidationList from "./ValidationList";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

      <div className="flex flex-col gap-1">
        <Label htmlFor="login-email" className="text-muted-foreground text-sm">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
        <ValidationList errors={emailErrors} />
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="login-password"
          className="text-muted-foreground text-sm"
        >
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          required
        />
        <ValidationList errors={passwordErrors} />
      </div>

      <Button
        type="submit"
        disabled={!isValid || submitting}
        className="bg-brand hover:bg-brand-dark mt-2 h-10 font-semibold text-(--button-text)"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
