import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useParams,
  useNavigate,
} from 'react-router';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const users: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Developer' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Designer' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Developer' },
];

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: 'none',
  color: isActive ? '#1976d2' : '#333',
  fontWeight: isActive ? ('bold' as const) : ('normal' as const),
  borderBottom: isActive ? '2px solid #1976d2' : '2px solid transparent',
  paddingBottom: 4,
});

function Navigation() {
  return (
    <nav style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
      <NavLink to="/" end style={navLinkStyle}>Home</NavLink>
      <NavLink to="/about" style={navLinkStyle}>About</NavLink>
      <NavLink to="/users" style={navLinkStyle}>Users</NavLink>
    </nav>
  );
}

function Home() {
  return (
    <div>
      <h2>Welcome!</h2>
      <p>This is a multi-page app built with React Router v6.</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
      <p>This app demonstrates client-side routing with React Router v6.</p>
    </div>
  );
}

function UserList() {
  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={`/users/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <div>
        <p>User not found.</p>
        <button onClick={() => navigate('/users')}>Back to Users</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <button onClick={() => navigate('/users')}>Back to Users</button>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h2>404 — Page Not Found</h2>
      <Link to="/">Go Home</Link>
    </div>
  );
}

export default function MultiPageApp() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <Navigation />
        <div style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
