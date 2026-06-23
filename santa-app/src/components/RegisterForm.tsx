import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../contexts/AuthContext";
import { RegisterSchema, type RegisterInput } from "../schemas/auth";

interface Props {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
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
      className="rounded-card p-card flex w-full max-w-sm flex-col gap-4 bg-white shadow-sm"
      noValidate
    >
      <h2 className="text-brand text-xl font-semibold">Create Account</h2>

      {errors.root?.serverError && (
        <p
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-600"
          role="alert"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="reg-name">
          Name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "reg-name-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="Taras Shevchenko"
          {...register("displayName")}
        />
        {errors.displayName && (
          <p id="reg-name-error" className="text-xs text-red-500" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-email"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p id="reg-email-error" className="text-xs text-red-500" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-password"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "reg-password-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p id="reg-password-error" className="text-xs text-red-500" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-confirm"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "reg-confirm-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
          {...register("confirm")}
        />
        {errors.confirm && (
          <p id="reg-confirm-error" className="text-xs text-red-500" role="alert">
            {errors.confirm.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={clsx(
          "rounded px-4 py-2 text-sm font-medium text-white transition-colors",
          isSubmitting
            ? "bg-brand/50 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        {isSubmitting ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}
