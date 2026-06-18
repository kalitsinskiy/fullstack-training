import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 'page' | 'section';
}

const styles = {
  page: 'text-2xl font-bold tracking-[-0.02em]',
  section: 'text-lg font-bold',
} as const;

export function Heading({ level = 'section', className, ...props }: HeadingProps) {
  const Tag = level === 'page' ? 'h1' : 'h2';

  return <Tag className={cn('text-foreground', styles[level], className)} {...props} />;
}
