import { useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
}

export function Input({ label, error, id: externalId, className, ...rest }: InputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;

  return (
    <div className="flex flex-col gap-[0.45rem]">
      <label htmlFor={id} className="text-muted text-[0.85rem] font-medium">
        {label}
      </label>
      <input
        id={id}
        className={clsx(
          'rounded-base w-full',
          'border-edge border',
          'bg-surface px-4 py-[0.85rem]',
          'text-fg font-[inherit] text-[0.95rem]',
          'placeholder:text-dim',
          'transition-[border-color,box-shadow] outline-none',
          error
            ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]'
            : 'focus-visible:border-brand',
          'focus-visible:shadow-[0_0_0_3px_rgba(74,222,128,0.18)]',
          className
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <p className="text-[0.78rem] text-red-500">{error}</p>}
    </div>
  );
}
