import { useState, createContext, useContext, type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useNavigate,
} from 'react-router';

interface AuthContextType {
  user: string | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login: setUser, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <span>Logged in as: <strong>{user}</strong></span>
        <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
      </header>
      <nav style={{ display: 'flex', gap: 16, padding: '8px 20px', borderBottom: '1px solid #eee' }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <main style={{ padding: 20 }}><Outlet /></main>
    </div>
  );
}

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username cannot be empty'); return; }
    login(username.trim());
    navigate('/dashboard');
  };

  return (
    <div style={{ padding: 40, maxWidth: 320 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input type="text" placeholder="Enter username" value={username}
            onChange={(e) => setUsername(e.target.value)} style={{ padding: '6px 10px', width: '100%' }} />
        </div>
        {error && <p style={{ color: 'red', margin: '4px 0' }}>{error}</p>}
        <button type="submit" style={{ padding: '6px 16px' }}>Login</button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  return <div><h2>Dashboard</h2><p>Welcome, <strong>{user}</strong>!</p></div>;
}

function Profile() {
  const { user } = useAuth();
  return <div><h2>Profile</h2><p><strong>Username:</strong> {user}</p></div>;
}

export default function ProtectedApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
