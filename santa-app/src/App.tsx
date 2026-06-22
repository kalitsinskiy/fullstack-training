import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { StatusMessage } from './components/ui/StatusMessage/StatusMessage';

const RoomsPage = lazy(() => import('./pages/RoomsPage').then((m) => ({ default: m.RoomsPage })));
const RoomsDetailedPage = lazy(() =>
  import('./pages/RoomDetailPage').then((m) => ({ default: m.RoomsDetailedPage }))
);
const WishlistPage = lazy(() =>
  import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

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

        <Route
          path="*"
          element={
            <Suspense
              fallback={<StatusMessage className="p-6 text-center">Loading...</StatusMessage>}
            >
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
