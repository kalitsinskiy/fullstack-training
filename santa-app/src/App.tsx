import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { SocketProvider } from '@/features/socket/SocketProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RoomListPage } from '@/pages/RoomListPage';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected */}
                <Route element={<AuthGuard />}>
                  <Route element={<AppLayout />}>
                    <Route path="/rooms" element={<RoomListPage />} />
                    <Route path="/rooms/:id" element={<RoomDetailPage />} />
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
