import { cn } from '@/lib/utils';
import { useUnreadCount } from './hooks';
import { cva, type VariantProps } from 'class-variance-authority';

const unreadBadgeVariants = cva(
  'flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground',
  {
    variants: {
      variant: {
        static: '',
        absoluteRightTop: 'absolute -right-1 -top-1',
        absoluteLeftTop: 'absolute -left-1 -top-1',
        absoluteRightBottom: 'absolute -right-1 -bottom-1',
        absoluteLeftBottom: 'absolute -left-1 -bottom-1',
      },
    },
    defaultVariants: {
      variant: 'static',
    },
  },
);

export interface UnreadBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof unreadBadgeVariants> {}

export function UnreadBadge({ variant }: UnreadBadgeProps) {
  const { data: count = 0 } = useUnreadCount();

  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-label={`${count} unread notifications`}
      className={cn(unreadBadgeVariants({ variant }))}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
