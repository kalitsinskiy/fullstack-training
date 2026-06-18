import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '../ui/Field';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { FormError } from '../ui/FormError';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const create = useMutation({
    mutationFn: (roomName: string) => api.post<Room>('/api/rooms', { name: roomName }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleOpenChange(false);
      navigate(`/rooms/${room.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create a room'),
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setError(null);
    create.mutate(name.trim());
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName('');
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FormError>{error}</FormError>

          <div className="flex flex-col gap-2 py-4">
            <Field
              label="Room name"
              id="room-name"
              placeholder="e.g. Office Party 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
