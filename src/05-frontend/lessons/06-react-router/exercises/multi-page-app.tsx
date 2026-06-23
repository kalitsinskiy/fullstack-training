// ============================================
// Exercise: Multi-Page App with React Router
// ============================================
//
// Build a multi-page app with React Router v6:
//
// Pages:
//   /           → Home page with welcome message
//   /about      → About page with app description
//   /users      → User list page showing all users as links
//   /users/:id  → User detail page showing user info
//   *           → 404 Not Found page
//
// Requirements:
// 1. Use BrowserRouter, Routes, Route
// 2. Add a Navigation bar with NavLink — highlight the active link
//    (active link should be bold and have a different color)
// 3. User list should use <Link> to navigate to user detail pages
// 4. User detail should use useParams to read the :id parameter
// 5. User detail should have a "Back to Users" button using useNavigate
// 6. 404 page should have a link back to Home
//
// To test: render this component in a Vite React app.

import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useParams, useNavigate } from 'react-router';

// ---- Data ----

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

// ---- TODO 1: Create Navigation component ----
// - Use NavLink for Home, About, Users
// - Style active links differently (bold, color change)
// - Use the style or className prop on NavLink with the isActive callback

function Navigation() {
  // TODO: Implement
  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#e25822' : '#333',
    textDecoration: 'none',
    marginRight: '1rem',
  });

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
      <NavLink to="/" end style={navLinkStyle}>
        Home
      </NavLink>
      <NavLink to="/about" style={navLinkStyle}>
        About
      </NavLink>
      <NavLink to="/users" style={navLinkStyle}>
        Users
      </NavLink>
    </nav>
  );
}

// ---- TODO 2: Create Home page ----

function Home() {
  // TODO: Implement — show a welcome message
  return (
    <div>
      <h1>Welcome to the Santa App!</h1>
      <p>Use the navigation above to explore the app.</p>
    </div>
  );
}

// ---- TODO 3: Create About page ----

function About() {
  // TODO: Implement — show app description
  return (
    <div>
      <h1>About</h1>
      <p>This is a multi-page demo app built with React Router v6.</p>
      <p>It demonstrates BrowserRouter, Routes, NavLink, Link, useParams, and useNavigate.</p>
    </div>
  );
}

// ---- TODO 4: Create UserList page ----
// - Display all users from the users array
// - Each user name should be a <Link> to /users/:id

function UserList() {
  // TODO: Implement
  return (
    <div>
      <h1>Users</h1>
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

// ---- TODO 5: Create UserDetail page ----
// - Use useParams to get the :id from the URL
// - Find the user in the users array
// - If user not found, show "User not found"
// - Show user name, email, role
// - Add a "Back to Users" button using useNavigate

function UserDetail() {
  // TODO: Implement
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <div>
        <p>User not found</p>
        <button onClick={() => navigate('/users')}>Back to Users</button>
      </div>
    );
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <button onClick={() => navigate('/users')}>Back to Users</button>
    </div>
  );
}

// ---- TODO 6: Create NotFound page ----
// - Show "404 — Page Not Found"
// - Add a <Link> back to Home

function NotFound() {
  // TODO: Implement
  return (
    <div>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go back to Home</Link>
    </div>
  );
}

// ---- TODO 7: Wire it all up ----
// - BrowserRouter wrapping the entire app
// - Navigation component at the top
// - Routes with all the pages
// - Don't forget the catch-all "*" route for 404

export default function MultiPageApp() {
  // TODO: Implement
  return (
    <BrowserRouter>
      <Navigation />
      <main style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
