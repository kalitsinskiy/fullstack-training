// ============================================
// Protected Routes Example
// ============================================
// Demonstrates ProtectedRoute component with Navigate redirect,
// layout routes with Outlet, and login/logout flow.

import { useState, createContext, useContext, ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useNavigate,
} from 'react-router';

// ---- Fake Auth Context ----

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  const value: AuthContextType = {
    user,
    login: (username) => setUser(username),
    logout: () => setUser(null),
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ---- ProtectedRoute ----
// If user is not authenticated, redirect to /login.
// Otherwise, render the child routes via <Outlet />.

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // `replace` prevents the protected URL from being in browser history
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ---- Layout ----
// Shared layout for authenticated pages. Uses Outlet to render child routes.

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: '#1976d2',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
            Profile
          </Link>
          <Link to="/settings" style={{ color: 'white', textDecoration: 'none' }}>
            Settings
          </Link>
        </div>
        <div>
          <span style={{ marginRight: 12 }}>Hello, {user}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={{ padding: 20 }}>
        <Outlet /> {/* child route content renders here */}
      </main>
    </div>
  );
}

// ---- Pages ----

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          style={{ padding: 8, width: '100%', marginBottom: 12 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>
          Login
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back, {user}! This page is only visible to authenticated users.</p>
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Profile</h2>
      <p>Username: {user}</p>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <p>App settings go here.</p>
    </div>
  );
}

// ---- App ----

export default function ProtectedRoutesApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — wrapped by ProtectedRoute guard */}
          <Route element={<ProtectedRoute />}>
            {/* Layout route — wraps all protected pages with header/nav */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<div style={{ padding: 20 }}>404 — Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
