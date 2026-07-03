import { Gift, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

/**
 * Dashboard — list of rooms the user owns or joined.
 * TODO(lesson 03 / 04): fetch GET /api/rooms with TanStack Query, render RoomCard grid,
 * wire "Create room" (POST /api/rooms) and "Join with code" (POST /api/rooms/:id/join).
 */
export function RoomListPage() {
  return (
    <>
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
        action={
          <Button>
            <Plus /> New room
          </Button>
        }
      />
      <EmptyState
        icon={Gift}
        title="No rooms yet"
        description="Create your first Secret Santa room or join one with an invite code."
        action={
          <div className="flex gap-2">
            <Button>
              <Plus /> Create a room
            </Button>
            <Button variant="outline">Join with code</Button>
          </div>
        }
      />
    </>
  );
}
