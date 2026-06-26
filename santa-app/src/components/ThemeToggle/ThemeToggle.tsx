import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch theme to light theme' : 'Switch theme to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="text-muted-foreground hover:bg-muted rounded-base flex cursor-pointer items-center justify-center p-1.5 transition-colors"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
