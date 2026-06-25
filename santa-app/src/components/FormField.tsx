import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id: externalId, className, ...rest }, ref) => {
    const autoId = useId()
    const id = externalId ?? autoId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const describedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={clsx(
            'focus-visible:ring-brand rounded border px-3 py-2 text-sm outline-none focus-visible:ring-2',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

FormField.displayName = 'FormField'

export default FormField
