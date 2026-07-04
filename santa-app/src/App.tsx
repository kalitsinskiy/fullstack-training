import { lazy } from "react";
import "./App.css";
import { Layout } from "./components/Layout";
import LoginForm from "./components/LoginForm";
import { NotFoundPage } from "./components/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import RegisterForm from "./components/RegisterForm";
import { BrowserRouter, Route, Routes } from "react-router";

const RoomDetailsPage = lazy(() => import("./components/RoomDetailsPage"));
const RoomList = lazy(() => import("./components/RoomList"));
const WishlistPage = lazy(() => import("./components/WishlistPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <main className="grid min-h-svh place-items-center px-4">
              <LoginForm />
            </main>
          }
        />
        <Route
          path="/register"
          element={
            <main className="grid min-h-svh place-items-center px-4">
              <RegisterForm />
            </main>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/rooms/:id" element={<RoomDetailsPage />} />
            <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
