import { NavBadge } from '@/components/NavBadge';
import { useUnreadCount } from './hooks';

export function NotificationsUnreadBadge() {
  const { data: count } = useUnreadCount();
  const total = count ?? 0;

  return <NavBadge count={total} label={`${total} unread notifications`} />;
}
