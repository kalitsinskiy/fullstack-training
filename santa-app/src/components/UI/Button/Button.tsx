import { clsx } from 'clsx';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
}

const variantClasses = {
  primary: clsx(
    'bg-gradient-to-r from-brand-dark to-brand-warm',
    'text-[#061206] font-extrabold tracking-[0.02em]',
    'shadow-[0_8px_24px_rgba(74,222,128,0.22)]',
    'hover:-translate-y-px',
    'hover:brightness-[1.08]',
    'hover:shadow-[0_12px_28px_rgba(74,222,128,0.35)]',
    'active:translate-y-0',
    'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
  ),
  outline: clsx(
    'border border-brand bg-transparent text-brand',
    'hover:bg-brand hover:text-page',
    'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
  ),
};

const sizeClasses = {
  sm: 'px-4 py-[0.4rem] text-[0.85rem]',
  md: 'px-8 py-[0.95rem] text-[0.95rem]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-base cursor-pointer font-semibold',
        'transition-all duration-150',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}
