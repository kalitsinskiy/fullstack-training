import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { FormError } from '../ui/FormError';
import { Muted } from '../ui/Muted';

interface DrawButtonProps {
  room: Room;
}

export function DrawButton({ room }: DrawButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const draw = useMutation({
    mutationFn: () => api.post<Room>(`/api/rooms/${room.id}/draw`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', room.id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Draw failed'),
  });

  const tooFew = room.members.length < 3;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={tooFew}
      >
        Run the draw
      </Button>
      {tooFew && (
        <span className="text-muted-foreground text-xs">Need at least 3 participants.</span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Run the Secret Santa draw?</DialogTitle>
          </DialogHeader>

          <FormError>{error}</FormError>

          <Muted className="py-2">
            This assigns every participant a recipient and can't be undone. No one can join after
            the draw.
          </Muted>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => draw.mutate()} disabled={draw.isPending}>
              {draw.isPending ? 'Drawing…' : 'Confirm draw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
