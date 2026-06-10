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

import { useEffect, useState } from 'react';
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
  fontWeight: isActive ? ('bold' as const) : ('normal' as const),
  borderBottom: isActive ? '2px solid #1976d2' : '2px solid transparent',
  paddingBottom: 4,
});

function Navigation() {
  // TODO: Implement
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

// ---- TODO 2: Create Home page ----

function Home() {
  // TODO: Implement — show a welcome message
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the multi page App.</p>
    </div>
  );
}

// ---- TODO 3: Create About page ----

function About() {
  // TODO: Implement — show app description
  return (
    <div>
      <h1>About</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam aliquam accusamus quo
        temporibus doloribus tempora animi ipsum voluptate eius non blanditiis maiores laudantium
        incidunt odio sequi, officia culpa eaque quam magni voluptates dolorum voluptatem, rerum
        expedita optio. Soluta ut sit fuga nesciunt ipsam magnam vero iste repudiandae nemo
        exercitationem? Minus accusantium excepturi facere sunt adipisci tempora. Officia, vitae.
        Sequi qui quam nisi debitis error dolorem ea placeat expedita harum voluptatibus deserunt
        similique laudantium a, totam, ullam rerum deleniti natus! Impedit, nulla ratione? Aut quas
        nobis beatae ipsa consectetur commodi voluptas, obcaecati laudantium molestias rem
        praesentium dolores? Veniam beatae maxime eum.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat minima rem suscipit
        deleniti atque, debitis consectetur. Dignissimos nam optio in dolorem! Totam facere ipsam
        eligendi ad tenetur exercitationem eos, tempora adipisci nemo dignissimos molestiae itaque
        quasi. Libero officiis, eligendi quisquam illum provident doloremque ut sint, ipsum
        blanditiis, quo voluptas est!
      </p>
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
      <ul style={{ listStyle: 'none', padding: 0 }}>
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

  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    setUser(users.find((user) => user.id === id));
  }, [id]);

  return (
    <div>
      <h1>User - #{id}</h1>
      {user ? (
        <>
          <p>Info:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <strong>Name:</strong> {user.name}
            </li>
            <li>
              <strong>Email:</strong> {user.email}
            </li>
            <li>
              <strong>Role:</strong> {user.role}
            </li>
          </ul>
        </>
      ) : (
        <p>User not found</p>
      )}
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
      <Link to="/">Go Home</Link>
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

      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
