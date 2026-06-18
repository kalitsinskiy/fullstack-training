// ============================================
// Exercise: Protected Routes App
// ============================================
//
// Build an app with authentication-based route protection:
//
// Routes:
//   /login      → Public login page
//   /dashboard  → Protected dashboard
//   /profile    → Protected profile page
//   /           → Redirect to /dashboard
//
// Requirements:
// 1. Create a simple AuthContext with { isAuthenticated, user, login, logout }
//    (in-memory, no real API — just store a username in state)
// 2. Create a ProtectedRoute component that:
//    - Checks isAuthenticated from context
//    - If NOT authenticated: redirects to /login with <Navigate replace />
//    - If authenticated: renders <Outlet /> for child routes
// 3. Create a Layout component with:
//    - Header showing user name and a Logout button
//    - Navigation links to Dashboard and Profile
//    - <Outlet /> for page content
// 4. LoginPage: form with username input, on submit calls login() and
//    navigates to /dashboard
// 5. If already authenticated, LoginPage should redirect to /dashboard
//
// To test: render this component in a Vite React app.
// Flow: open app → redirected to /login → enter name → see dashboard
// → navigate to profile → logout → redirected to /login

import { useState, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router';

// ---- Types ----

interface AuthContextType {
  user: string | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

// ---- TODO 1: Create AuthContext and AuthProvider ----
// - createContext with default null
// - AuthProvider holds user state
// - login sets user, logout clears user
// - isAuthenticated = user !== null

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    login: (username: string) => setUser(username),
    logout: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---- TODO 2: Create useAuth hook ----
// - useContext(AuthContext)
// - Throw error if used outside AuthProvider

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ---- TODO 3: Create ProtectedRoute component ----
// - Use useAuth() to check isAuthenticated
// - If not authenticated: return <Navigate to="/login" replace />
// - If authenticated: return <Outlet />

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ---- TODO 4: Create Layout component ----
// - Show header with user name and Logout button
// - Logout should call auth.logout() and navigate to /login
// - Show navigation links (Dashboard, Profile)
// - Render <Outlet /> for child route content

function Layout() {
  const [user, logout] = useAuth();
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

// ---- TODO 5: Create LoginPage ----
// - If already authenticated, redirect to /dashboard
// - Form with username input
// - On submit: call login(username), navigate to /dashboard
// - Validate that username is not empty

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username);
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

// ---- TODO 6: Create Dashboard page ----

function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back, {user}! This dashboard page is visible only to authenticated users.</p>
    </div>
  );
}

// ---- TODO 7: Create Profile page ----

function Profile() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Profile</h2>
      <p>Username: {user ?? 'unknown'}</p>
    </div>
  );
}

// ---- TODO 8: Wire it all together ----
// - AuthProvider wrapping BrowserRouter
// - Public route: /login
// - ProtectedRoute wrapping Layout wrapping Dashboard and Profile
// - "/" redirects to /dashboard
// - 404 catch-all

export default function ProtectedApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
