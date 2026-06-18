import { useAuth } from '@/hooks/useAuth';
import { useAssigneeWishlist } from '@/hooks/useAssigneeWishlist';
import type { Room } from '@/types/api';
import { AssigneeWishlist } from '../AssigneeWishlist';
import { Gift } from 'lucide-react';

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
        <h2 className="text-foreground text-lg font-bold">Your assignment</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Awaiting draw — your match appears once the room owner runs the draw.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card border-border border p-6">
      <h2 className="text-foreground text-lg font-bold">
        You're the Secret Santa to{' '}
        <span className="text-brand-soft flex items-center gap-2">
          {recipientName} <Gift size={15} className="text-brand-soft" />
        </span>
      </h2>
      <div className="mt-3">
        <AssigneeWishlist roomId={room.id} userId={recipientId} />
      </div>
    </section>
  );
}
