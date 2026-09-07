import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { SocketProvider } from '@/features/socket/SocketProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Toaster } from '@/components/ui/sonner';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';

const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const RoomListPage = lazy(() =>
  import('@/pages/RoomListPage').then((m) => ({ default: m.RoomListPage })),
);
const RoomDetailPage = lazy(() =>
  import('@/pages/RoomDetailPage').then((m) => ({ default: m.RoomDetailPage })),
);
const MessagesPage = lazy(() =>
  import('@/pages/MessagesPage').then((m) => ({ default: m.MessagesPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const RoomMessagesPage = lazy(() =>
  import('@/pages/RoomMessagesPage').then((m) => ({
    default: m.RoomMessagesPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected */}
                <Route element={<AuthGuard />}>
                  <Route element={<AppLayout />}>
                    <Route path="/rooms" element={<RoomListPage />} />
                    <Route path="/rooms/:id" element={<RoomDetailPage />} />
                    <Route
                      path="/rooms/:id/messages"
                      element={<RoomMessagesPage />}
                    />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route
                      path="/notifications"
                      element={<NotificationsPage />}
                    />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </SocketProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
