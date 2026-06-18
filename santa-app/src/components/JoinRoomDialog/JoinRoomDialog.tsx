import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Field } from '../ui/Field';
import { Button } from '../ui/button';
import { FormError } from '../ui/FormError';

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const joinRoom = useMutation({
    mutationFn: (inviteCode: string) => api.post<Room>(`/api/rooms/${inviteCode}/join`),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', room.id] });
      handleOpenChange(false);
      navigate(`/rooms/${room.id}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not join the room'),
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    const enveloped = code.trim().toUpperCase();

    if (enveloped.length !== 6) return;

    setError(null);
    joinRoom.mutate(enveloped);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCode('');
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w[420px]">
        <DialogHeader>
          <DialogTitle>Join the room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FormError>{error}</FormError>

          <div className="flex flex-col gap-2 py-4">
            <Field
              label="Invite code"
              id="invite-code"
              placeholder="6-character code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
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
            <Button
              type="submit"
              size="sm"
              disabled={code.trim().length !== 6 || joinRoom.isPending}
            >
              {joinRoom.isPending ? 'Joining...' : 'Join'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
