import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSchema, type LoginInput } from "@/schemas/auth";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const submit = async (data: LoginInput) => {
    try {
      await auth.login(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      setError("root.serverError", {
        message: err instanceof Error ? err.message : "Login failed",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="rounded-card p-card bg-surface w-full max-w-sm shadow-md"
    >
      {errors.root?.serverError && (
        <p
          role="alert"
          className="text-danger mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Sign in</legend>

        <Label htmlFor="login-email">Email Address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="login-email-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.email.message}
          </p>
        )}

        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          {...register("password")}
        />
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.password.message}
          </p>
        )}
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
