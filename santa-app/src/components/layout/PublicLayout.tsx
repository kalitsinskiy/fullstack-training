import { Outlet, useLocation } from 'react-router-dom';
import { AppErrorBoundary } from '../AppErrorBoundary';

export function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <AppErrorBoundary resetKeys={[pathname]}>
      <Outlet />
    </AppErrorBoundary>
  );
}
