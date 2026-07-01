import { forwardRef, useId } from "react";

type Props = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">;

const fieldClass =
  "focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export const FormField = forwardRef<HTMLInputElement, Props>(
  function FormField({ label, error, hint, className, ...inputProps }, ref) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy =
      [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-text-muted text-sm font-medium">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={className ?? fieldClass}
          {...inputProps}
        />
        {hint && !error && (
          <span id={hintId} className="text-text-muted text-xs">
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} role="alert" className="text-danger text-xs">
            {error}
          </span>
        )}
      </div>
    );
  },
);
