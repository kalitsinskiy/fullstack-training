import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterSchema, type RegisterInput } from "@/schemas/auth";

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const submit = async (data: RegisterInput) => {
    try {
      await auth.register(data.email, data.password, data.displayName);
      onSuccess?.();
    } catch (err) {
      setError("root.serverError", {
        message: err instanceof Error ? err.message : "Registration failed",
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
        <legend className="text-brand px-2 font-semibold">
          Account details
        </legend>

        <Label htmlFor="register-name">Full Name</Label>
        <Input
          id="register-name"
          type="text"
          placeholder="John Doe"
          aria-invalid={!!errors.displayName}
          aria-describedby={
            errors.displayName ? "register-name-error" : undefined
          }
          {...register("displayName")}
        />
        {errors.displayName && (
          <p
            id="register-name-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.displayName.message}
          </p>
        )}

        <Label htmlFor="register-email">Email Address</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="register-email-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.email.message}
          </p>
        )}

        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="At least 8 characters"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "register-password-error" : undefined
          }
          {...register("password")}
        />
        {errors.password && (
          <p
            id="register-password-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.password.message}
          </p>
        )}

        <Label htmlFor="register-confirm">Confirm Password</Label>
        <Input
          id="register-confirm"
          type="password"
          placeholder="Repeat your password"
          aria-invalid={!!errors.confirm}
          aria-describedby={
            errors.confirm ? "register-confirm-error" : undefined
          }
          {...register("confirm")}
        />
        {errors.confirm && (
          <p
            id="register-confirm-error"
            role="alert"
            className="text-danger text-sm"
          >
            {errors.confirm.message}
          </p>
        )}
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
