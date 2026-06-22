import { useState, type SyntheticEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;

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

  const isDisabled = submitting || !email || !password || !!emailError || !!passwordError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card bg-surface w-full max-w-sm shadow-md"
    >
      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Sign in</legend>

        <Label htmlFor="login-email">Email Address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          aria-invalid={!!emailError}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={(e) => setEmailError(validateEmail(e.target.value))}
        />
        {emailError && <p className="text-danger text-sm">{emailError}</p>}

        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={password}
          aria-invalid={!!passwordError}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
        />
        {passwordError && <p className="text-danger text-sm">{passwordError}</p>}
      </fieldset>

      {submitError && (
        <p className="text-danger mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isDisabled} className="mt-4 w-full">
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
