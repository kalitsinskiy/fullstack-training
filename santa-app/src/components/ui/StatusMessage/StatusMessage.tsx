import { cn } from '@/lib/utils';

interface StatusMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'muted' | 'error';
}
export function StatusMessage({ variant = 'muted', className, ...props }: StatusMessageProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : undefined}
      className={cn(
        'text-sm',
        variant === 'error' ? 'text-red-500' : 'text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
