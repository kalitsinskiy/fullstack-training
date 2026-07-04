import { forwardRef, useId } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

type Props = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">;

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, hint, ...inputProps },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        {label}
      </Label>
      <Input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <span id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
});
