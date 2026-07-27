import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/features/notifications/api';

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <button
      type="button"
      onClick={() => navigate('/notifications')}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      className="relative rounded-full p-2 text-primary transition-colors hover:bg-primary/10"
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
