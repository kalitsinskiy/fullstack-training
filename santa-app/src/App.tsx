import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import PageSpinner from "./components/PageSpinner";
import RootErrorFallback from "./components/RootErrorFallback";
import RouteFallback from "./components/RouteFallback";

const RoomsPage = lazy(() => import("./pages/RoomsPage"));
const RoomDetailPage = lazy(() => import("./pages/RoomDetailPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));

function App() {
  return (
    <ErrorBoundary FallbackComponent={RootErrorFallback}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route
                index
                element={
                  <Suspense fallback={<PageSpinner />}>
                    <Navigate to="/rooms" replace />
                  </Suspense>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ErrorBoundary FallbackComponent={RouteFallback}>
                    <Suspense fallback={<PageSpinner />}>
                      <RoomsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/rooms/:id"
                element={
                  <ErrorBoundary FallbackComponent={RouteFallback}>
                    <Suspense fallback={<PageSpinner />}>
                      <RoomDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/rooms/:id/wishlist"
                element={
                  <ErrorBoundary FallbackComponent={RouteFallback}>
                    <Suspense fallback={<PageSpinner />}>
                      <WishlistPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
