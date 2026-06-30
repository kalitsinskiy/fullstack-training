import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RegisterSchema, type RegisterInput } from "../schemas/auth";

export default function RegisterForm() {
  const auth = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
  });

  const submit = async (data: RegisterInput) => {
    try {
      await auth.register(data.email, data.password, data.displayName);
      navigate("/rooms", { replace: true });
    } catch (err) {
      setError("root.serverError", {
        message: err instanceof Error ? err.message : "Registration failed",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="register form"
      className="flex w-[360px] flex-col gap-3 rounded-lg bg-(--surface) p-4 shadow"
    >
      <h3 className="text-lg font-semibold text-(--text)">Register</h3>

      {errors.root?.serverError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.serverError.message}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-name"
          className="text-muted-foreground text-sm"
        >
          Full name
        </Label>
        <Input
          id="register-name"
          autoComplete="name"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "register-name-error" : undefined}
          disabled={isSubmitting}
          {...register("displayName")}
        />
        {errors.displayName && (
          <span
            id="register-name-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.displayName.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-email"
          className="text-muted-foreground text-sm"
        >
          Email
        </Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          disabled={isSubmitting}
          {...register("email")}
        />
        {errors.email && (
          <span
            id="register-email-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-password"
          className="text-muted-foreground text-sm"
        >
          Password
        </Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "register-password-error" : undefined}
          disabled={isSubmitting}
          {...register("password")}
        />
        {errors.password && (
          <span
            id="register-password-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-confirm"
          className="text-muted-foreground text-sm"
        >
          Confirm password
        </Label>
        <Input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "register-confirm-error" : undefined}
          disabled={isSubmitting}
          {...register("confirm")}
        />
        {errors.confirm && (
          <span
            id="register-confirm-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.confirm.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand hover:bg-brand-dark h-10 rounded-md px-4 font-semibold text-(--button-text)"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
