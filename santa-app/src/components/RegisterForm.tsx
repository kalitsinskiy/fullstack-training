import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { RegisterSchema, type RegisterInput } from "../schemas/auth";
import { FormField } from "./FormField";

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

      <FormField
        type="text"
        label="Display name"
        disabled={isSubmitting}
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <FormField
        type="email"
        label="Email"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
      />

      <FormField
        type="password"
        label="Password"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      <FormField
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.confirm?.message}
        {...register("confirm")}
      />

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
