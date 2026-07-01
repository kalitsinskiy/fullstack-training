import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useAuth } from "../contexts/AuthContext";
import { RegisterSchema, type RegisterInput } from "../schemas/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
}

const fieldClass =
  "focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function RegisterForm({ onSuccess }: RegisterFormProps = {}) {
  const auth = useAuth();
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
      noValidate
      className="rounded-card bg-surface p-card mx-auto w-full max-w-sm shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Create Account</h2>

      {errors.root?.serverError && (
        <p
          role="alert"
          className="text-danger mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-name"
          className="text-text-muted text-sm font-medium"
        >
          Name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "reg-name-error" : undefined}
          className={fieldClass}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p id="reg-name-error" role="alert" className="text-danger text-xs">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-email"
          className="text-text-muted text-sm font-medium"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
          className={fieldClass}
          {...register("email")}
        />
        {errors.email && (
          <p id="reg-email-error" role="alert" className="text-danger text-xs">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-password"
          className="text-text-muted text-sm font-medium"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "reg-password-error" : undefined}
          className={fieldClass}
          {...register("password")}
        />
        {errors.password && (
          <p
            id="reg-password-error"
            role="alert"
            className="text-danger text-xs"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <label
          htmlFor="reg-confirm"
          className="text-text-muted text-sm font-medium"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "reg-confirm-error" : undefined}
          className={fieldClass}
          {...register("confirm")}
        />
        {errors.confirm && (
          <p id="reg-confirm-error" role="alert" className="text-danger text-xs">
            {errors.confirm.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={clsx(
          "w-full rounded-md px-4 py-2 font-medium text-white transition-colors",
          "focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          isSubmitting
            ? "bg-brand/40 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        {isSubmitting ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
