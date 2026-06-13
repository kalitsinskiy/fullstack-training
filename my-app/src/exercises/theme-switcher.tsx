import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  cardBackground: string;
  border: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const themes: Record<Theme, ThemeColors> = {
  light: {
    background: '#f5f5f5',
    text: '#1a1a1a',
    primary: '#1976d2',
    cardBackground: '#ffffff',
    border: '#e0e0e0',
  },
  dark: {
    background: '#121212',
    text: '#e0e0e0',
    primary: '#90caf9',
    cardBackground: '#1e1e1e',
    border: '#333333',
  },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const colors = themes[theme];
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

function Header() {
  const { theme, colors, toggleTheme } = useTheme();
  return (
    <header
      style={{
        background: colors.primary,
        color: '#fff',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontWeight: 600 }}>Theme Switcher</span>
      <button
        onClick={toggleTheme}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          borderRadius: 4,
          padding: '6px 12px',
          cursor: 'pointer',
        }}
      >
        Switch to {theme === 'light' ? 'Dark' : 'Light'}
      </button>
    </header>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <div
      style={{
        background: colors.cardBackground,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}

function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        background: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        padding: '8px 16px',
        cursor: 'pointer',
        marginTop: 8,
      }}
    >
      {children}
    </button>
  );
}

export default function ThemeSwitcherApp() {
  return (
    <ThemeProvider>
      <Header />
      <div style={{ padding: 20 }}>
        <Card title="Welcome">
          <p>This card should change appearance based on the current theme.</p>
          <Button onClick={() => alert('Clicked!')}>Click Me</Button>
        </Card>
        <Card title="About Themes">
          <p>
            The light theme has a white background and dark text. The dark theme has a dark
            background and light text.
          </p>
          <Button>Another Button</Button>
        </Card>
      </div>
    </ThemeProvider>
  );
}
