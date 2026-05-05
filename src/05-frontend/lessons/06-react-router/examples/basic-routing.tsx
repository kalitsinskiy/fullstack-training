// ============================================
// Basic Routing Example
// ============================================
// Demonstrates BrowserRouter, Routes, Route, Link, NavLink,
// useParams, useNavigate, and a 404 catch-all route.
//
// To run: add this component to a Vite React app and open in browser.

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useParams,
  useNavigate,
} from 'react-router';

// ---- Page Components ----

function Home() {
  return (
    <div>
      <h2>Home</h2>
      <p>Welcome to the app. Use the navigation above to explore.</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
      <p>This is a demo of React Router v6 basic routing.</p>
    </div>
  );
}

function UserList() {
  const users = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
  ];

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {/* Link navigates without page reload */}
            <Link to={`/users/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserDetail() {
  // useParams extracts dynamic segments from the URL
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <h2>User Detail</h2>
      <p>Viewing user with ID: <strong>{id}</strong></p>
      {/* Programmatic navigation */}
      <button onClick={() => navigate('/users')}>Back to Users</button>
      <button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
        Go Back (history)
      </button>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h2>404 — Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

// ---- Navigation with NavLink ----

const navStyle = {
  display: 'flex',
  gap: 16,
  padding: '12px 20px',
  borderBottom: '1px solid #ddd',
  backgroundColor: '#f9f9f9',
};

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: 'none',
  color: isActive ? '#1976d2' : '#333',
  fontWeight: isActive ? 'bold' as const : 'normal' as const,
  borderBottom: isActive ? '2px solid #1976d2' : '2px solid transparent',
  paddingBottom: 4,
});

function Navigation() {
  return (
    <nav style={navStyle}>
      <NavLink to="/" end style={linkStyle}>
        Home
      </NavLink>
      <NavLink to="/about" style={linkStyle}>
        About
      </NavLink>
      <NavLink to="/users" style={linkStyle}>
        Users
      </NavLink>
    </nav>
  );
}

// ---- App ----

export default function BasicRoutingApp() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <Navigation />

        <div style={{ padding: 20 }}>
          <Routes>
            {/* Index route — matches "/" exactly */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/users" element={<UserList />} />
            {/* Dynamic segment :id */}
            <Route path="/users/:id" element={<UserDetail />} />
            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
