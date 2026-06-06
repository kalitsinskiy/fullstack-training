import { useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  label: string;
}

export function Input({
  label,
  id: externalId,
  className,
  ...rest
}: InputProps) {
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
          'border border-edge',
          'bg-surface px-4 py-[0.85rem]',
          'font-[inherit] text-[0.95rem] text-fg',
          'placeholder:text-dim',
          'transition-[border-color,box-shadow] outline-none',
          'focus-visible:border-brand',
          'focus-visible:shadow-[0_0_0_3px_rgba(74,222,128,0.18)]',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
