import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { api } from '@/services/api';

interface DeleteRoomButtonProps {
  roomId: string;
}

export function DeleteRoomButton({ roomId }: DeleteRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const del = useMutation({
    mutationFn: () => api.delete<void>(`/api/rooms/${roomId}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['rooms', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/rooms');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not delete the room'),
  });

  return (
    <>
      <Button
        variant="destructive"
        className="cursor-pointer"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete Room
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm-max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this room?</DialogTitle>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-[0.85rem] text-red-500">
              {error}
            </p>
          )}
          <p className="text-muted-foreground py-2 text-sm">
            This permanently removes the room for everyone.
            <br /> This can't be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => del.mutate()} disabled={del.isPending}>
              {del.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
