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
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useNavigate,
} from 'react-router';

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

// ---- TODO 2: Create useAuth hook ----
// - useContext(AuthContext)
// - Throw error if used outside AuthProvider

// ---- TODO 3: Create ProtectedRoute component ----
// - Use useAuth() to check isAuthenticated
// - If not authenticated: return <Navigate to="/login" replace />
// - If authenticated: return <Outlet />

function ProtectedRoute() {
  // TODO: Implement
  return <Outlet />;
}

// ---- TODO 4: Create Layout component ----
// - Show header with user name and Logout button
// - Logout should call auth.logout() and navigate to /login
// - Show navigation links (Dashboard, Profile)
// - Render <Outlet /> for child route content

function Layout() {
  // TODO: Implement
  return (
    <div>
      <header>Layout header — implement me</header>
      <main>
        <Outlet />
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
  // TODO: Implement
  return <div>LoginPage — implement me</div>;
}

// ---- TODO 6: Create Dashboard page ----

function Dashboard() {
  // TODO: Show welcome message with user name
  return <div>Dashboard — implement me</div>;
}

// ---- TODO 7: Create Profile page ----

function Profile() {
  // TODO: Show user profile info
  return <div>Profile — implement me</div>;
}

// ---- TODO 8: Wire it all together ----
// - AuthProvider wrapping BrowserRouter
// - Public route: /login
// - ProtectedRoute wrapping Layout wrapping Dashboard and Profile
// - "/" redirects to /dashboard
// - 404 catch-all

export default function ProtectedApp() {
  // TODO: Implement
  return <div>ProtectedApp — implement me</div>;
}
