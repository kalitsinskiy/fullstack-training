import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/rooms/usePermissions';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RoomDetail, Wishlist, Assignment } from '@/types/api';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wishlistInput, setWishlistInput] = useState('');

  const { data: room, isLoading: roomLoading } = useQuery<RoomDetail>({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const { data } = await api.get<RoomDetail>(`/api/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { can } = usePermissions(room);

  const { data: wishlist } = useQuery<Wishlist>({
    queryKey: ['rooms', id, 'wishlist', user?.id],
    queryFn: async () => {
      const { data } = await api.get<Wishlist>(`/api/rooms/${id}/wishlist/${user!.id}`);
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: assignment } = useQuery<Assignment>({
    queryKey: ['rooms', id, 'assignment'],
    queryFn: async () => {
      const { data } = await api.get<Assignment>(`/api/rooms/${id}/assignment`);
      return data;
    },
    enabled: !!id && room?.status === 'drawn',
  });

  const updateWishlistMutation = useMutation({
    mutationFn: async (items: string[]) => {
      await api.put(`/api/rooms/${id}/wishlist`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id, 'wishlist'] });
      toast.success('Wishlist updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update wishlist'));
    },
  });

  const drawMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/rooms/${id}/draw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms', id, 'assignment'] });
      toast.success('Names have been drawn!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to draw names'));
    },
  });

  function handleWishlistSubmit(e: FormEvent) {
    e.preventDefault();
    const items = wishlistInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    updateWishlistMutation.mutate(items);
  }

  if (roomLoading) {
    return (
      <>
        <PageHeader title="Room" description="Loading..." />
      </>
    );
  }

  if (!room) {
    return (
      <>
        <PageHeader title="Room" description="Room not found." />
      </>
    );
  }

  return (
    <>
      <PageHeader title={room.name} description={`Status: ${room.status}`} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite code: <code className="rounded bg-muted px-1 py-0.5">{room.inviteCode}</code>
            </p>
            <ul className="space-y-1">
              {room.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span>{p.displayName}</span>
                  {p.role === 'owner' && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      owner
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wishlist && wishlist.items.length > 0 && (
              <ul className="list-inside list-disc text-sm">
                {wishlist.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {can('wishlist:set') && (
              <form onSubmit={handleWishlistSubmit} className="space-y-2">
                <Input
                  placeholder="One item per line"
                  value={wishlistInput}
                  onChange={(e) => setWishlistInput(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={updateWishlistMutation.isPending}>
                  {updateWishlistMutation.isPending ? 'Saving...' : 'Save wishlist'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {can('room:draw') && room.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Draw names</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => drawMutation.mutate()} disabled={drawMutation.isPending}>
                {drawMutation.isPending ? 'Drawing...' : 'Draw names'}
              </Button>
            </CardContent>
          </Card>
        )}

        {room.status === 'drawn' && assignment && (
          <Card>
            <CardHeader>
              <CardTitle>Your assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                You are gifting: <strong>{assignment.receiver.displayName}</strong>
              </p>
              {assignment.receiver.wishlist.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Their wishlist
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {assignment.receiver.wishlist.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
