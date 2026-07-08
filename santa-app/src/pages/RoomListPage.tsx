import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Gift, Plus } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomDetail } from '@/types/api';

interface RoomsResponse {
  data: RoomDetail[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function RoomListPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { data: roomsResponse, isLoading } = useQuery<RoomsResponse>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get<RoomsResponse>('/api/rooms');
      return data;
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/api/rooms', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setNewRoomName('');
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create room'));
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post('/api/rooms/join', { inviteCode: code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setInviteCode('');
      setShowJoinForm(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to join room'));
    },
  });

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    createRoomMutation.mutate(newRoomName);
  }

  function handleJoinSubmit(e: FormEvent) {
    e.preventDefault();
    joinRoomMutation.mutate(inviteCode);
  }

  const rooms = roomsResponse?.data ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Your rooms" description="Rooms you created or joined." />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus /> New room
            </Button>
            <Button variant="outline" onClick={() => setShowJoinForm(!showJoinForm)}>
              Join with code
            </Button>
          </div>
        }
      />

      {showCreateForm && (
        <Card className="mb-6 max-w-sm">
          <CardHeader>
            <CardTitle>Create a room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room name</Label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={createRoomMutation.isPending}>
                {createRoomMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showJoinForm && (
        <Card className="mb-6 max-w-sm">
          <CardHeader>
            <CardTitle>Join a room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={joinRoomMutation.isPending}>
                {joinRoomMutation.isPending ? 'Joining...' : 'Join'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No rooms yet"
          description="Create your first Secret Santa room or join one with an invite code."
          action={
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus /> Create a room
              </Button>
              <Button variant="outline" onClick={() => setShowJoinForm(true)}>
                Join with code
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      room.status === 'drawn'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {room.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
