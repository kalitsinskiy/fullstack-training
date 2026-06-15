import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Room detail — participants, your wishlist, the draw, and your assignment.
 * TODO(lesson 03): fetch GET /api/rooms/:id; render participant list + invite code.
 * TODO(lesson 03): wishlist editor → PUT /api/rooms/:id/wishlist.
 * TODO(lesson 03): "Draw names" (creator only) → POST /api/rooms/:id/draw, then reveal
 *                  GET /api/rooms/:id/assignment.
 */
export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageHeader title="Room" description={`Room id: ${id}`} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            TODO: participant chips + invite code (lesson 03)
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">TODO: wishlist editor (lesson 03)</p>
            <Button disabled>Draw names</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
