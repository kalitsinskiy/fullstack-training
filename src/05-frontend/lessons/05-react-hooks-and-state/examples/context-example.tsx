// ============================================
// Context Example — ThemeContext
// ============================================
// Demonstrates createContext, Provider, useContext, and a custom hook.
// A ThemeContext provides "light" or "dark" to all nested components
// without prop drilling.

import { createContext, useContext, useState, ReactNode } from 'react';

// ---- 1. Define the context type ----

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// ---- 2. Create the context ----
// Default value is null — we will guard with a custom hook.

const ThemeContext = createContext<ThemeContextType | null>(null);

// ---- 3. Create the Provider ----
// The Provider holds the state and exposes it via context value.

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---- 4. Custom hook for consumption ----
// Throws if used outside the Provider — catches bugs early.

function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}

// ---- 5. Consumer components ----
// These components access the theme without receiving it as a prop.

const themeStyles = {
  light: { background: '#ffffff', color: '#1a1a1a', border: '1px solid #e0e0e0' },
  dark: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444' },
};

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{ ...themeStyles[theme], padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>My App</h1>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'Dark' : 'Light'}
      </button>
    </header>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div style={{ ...themeStyles[theme], padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Footer() {
  const { theme } = useTheme();

  return (
    <footer style={{ ...themeStyles[theme], padding: 12, textAlign: 'center', fontSize: 14 }}>
      Current theme: <strong>{theme}</strong>
    </footer>
  );
}

// ---- 6. Main App ----
// The Provider wraps everything. Components at ANY depth can use useTheme().

function Content() {
  return (
    <div>
      <Card title="Welcome">
        <p>This card reads the theme from context.</p>
      </Card>
      <Card title="No Prop Drilling">
        <p>Neither Card nor Footer receive theme as a prop — they get it from ThemeContext.</p>
      </Card>
      <Footer />
    </div>
  );
}

export default function ThemeApp() {
  return (
    <ThemeProvider>
      <Header />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </ThemeProvider>
  );
}
