import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { RoomsPage } from './pages/RoomsPage';
import { RoomsDetailedPage } from './pages/RoomDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/rooms" replace />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:id" element={<RoomsDetailedPage />} />
            <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
