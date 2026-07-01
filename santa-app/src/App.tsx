import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const RoomsPage = lazy(() =>
  import("./pages/RoomsPage").then((m) => ({ default: m.RoomsPage })),
);
const RoomDetailPage = lazy(() =>
  import("./pages/RoomDetailPage").then((m) => ({ default: m.RoomDetailPage })),
);
const WishlistPage = lazy(() =>
  import("./pages/WishlistPage").then((m) => ({ default: m.WishlistPage })),
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/rooms" replace />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
