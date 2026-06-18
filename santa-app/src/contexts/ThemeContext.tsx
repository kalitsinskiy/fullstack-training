/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');

  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('prefers-color-scheme: dark').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const body = document.body;

    body.classList.remove('light', 'dark');
    body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  function toggle() {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
  );
}
