import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { getApiErrorMessage } from '@/lib/api';
import { joinRoomSchema, type JoinRoomFormInput } from '@/schemas/rooms';
import { normalizeInviteCode } from '@/features/rooms/helpers';
import { useJoinRoom } from '@/features/rooms/hooks';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRoomDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const joinRoom = useJoinRoom();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinRoomFormInput>({
    resolver: zodResolver(joinRoomSchema),
  });

  function close(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(values: JoinRoomFormInput) {
    try {
      const room = await joinRoom.mutateAsync(
        normalizeInviteCode(values.inviteCode),
      );
      toast.success('Joined the room');
      close(false);
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't join — check the code"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code you were given.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Invite code"
            placeholder="ABC123"
            maxLength={6}
            autoFocus
            className="font-mono uppercase tracking-widest"
            {...register('inviteCode')}
            error={errors.inviteCode?.message}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={joinRoom.isPending}>
              {joinRoom.isPending ? 'Joining…' : 'Join'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
