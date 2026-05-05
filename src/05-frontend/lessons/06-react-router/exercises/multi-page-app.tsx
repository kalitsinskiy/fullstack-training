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

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useParams,
  useNavigate,
} from 'react-router';

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
  return <nav>Navigation — implement me</nav>;
}

// ---- TODO 2: Create Home page ----

function Home() {
  // TODO: Implement — show a welcome message
  return <div>Home — implement me</div>;
}

// ---- TODO 3: Create About page ----

function About() {
  // TODO: Implement — show app description
  return <div>About — implement me</div>;
}

// ---- TODO 4: Create UserList page ----
// - Display all users from the users array
// - Each user name should be a <Link> to /users/:id

function UserList() {
  // TODO: Implement
  return <div>UserList — implement me</div>;
}

// ---- TODO 5: Create UserDetail page ----
// - Use useParams to get the :id from the URL
// - Find the user in the users array
// - If user not found, show "User not found"
// - Show user name, email, role
// - Add a "Back to Users" button using useNavigate

function UserDetail() {
  // TODO: Implement
  return <div>UserDetail — implement me</div>;
}

// ---- TODO 6: Create NotFound page ----
// - Show "404 — Page Not Found"
// - Add a <Link> back to Home

function NotFound() {
  // TODO: Implement
  return <div>NotFound — implement me</div>;
}

// ---- TODO 7: Wire it all up ----
// - BrowserRouter wrapping the entire app
// - Navigation component at the top
// - Routes with all the pages
// - Don't forget the catch-all "*" route for 404

export default function MultiPageApp() {
  // TODO: Implement
  return <div>MultiPageApp — implement me</div>;
}
