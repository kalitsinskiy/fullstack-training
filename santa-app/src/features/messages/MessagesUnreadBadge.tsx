import { NavBadge } from '@/components/NavBadge';
import { useUnreadMessages } from './hooks';

export function MessagesUnreadBadge() {
  const { data } = useUnreadMessages();
  const total = data?.total ?? 0;

  return <NavBadge count={total} label={`${total} unread messages`} />;
}
