import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
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

        <FormField
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.displayName?.message}
          {...register("displayName")}
        />

        <FormField
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        <FormField
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
