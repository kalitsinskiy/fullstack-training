import { useAuth } from '@/hooks/useAuth';
import { useAssigneeWishlist } from '@/hooks/useAssigneeWishlist';
import type { Room } from '@/types/api';
import { AssigneeWishlist } from '../AssigneeWishlist';
import { Gift } from 'lucide-react';
import { Heading } from '../ui/Heading';
import { Muted } from '../ui/Muted';

interface MyAssignmentProps {
  room: Room;
}

export function MyAssignment({ room }: MyAssignmentProps) {
  const { user } = useAuth();
  const recipientId = room.status !== 'pending' ? room.assignments?.[user?.id ?? ''] : undefined;

  const { data } = useAssigneeWishlist(room.id, recipientId);
  const recipientName = data?.userName ?? 'your match';

  if (!recipientId) {
    return (
      <section className="rounded-card border-border border p-6">
        <Heading>Your assignment</Heading>
        <Muted className="mt-2">
          Awaiting draw — your match appears once the room owner runs the draw.
        </Muted>
      </section>
    );
  }

  return (
    <section className="rounded-card border-border border p-6">
      <Heading>
        You're the Secret Santa to{' '}
        <span className="text-brand-soft flex items-center gap-2">
          {recipientName} <Gift size={15} className="text-brand-soft" />
        </span>
      </Heading>
      <div className="mt-3">
        <AssigneeWishlist roomId={room.id} userId={recipientId} />
      </div>
    </section>
  );
}
