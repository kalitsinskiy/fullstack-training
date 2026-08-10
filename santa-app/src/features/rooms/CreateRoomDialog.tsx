import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { SelectField } from '@/components/ui/select-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CURRENCIES,
  createRoomSchema,
  type CreateRoomFormInput,
} from '@/schemas/rooms';
import { useCreateRoom } from '@/features/rooms/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateRoomFormInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { currency: '$' },
  });

  function close(next: boolean) {
    if (!next) reset({ currency: '$' });

    onOpenChange(next);
  }

  function onSubmit(values: CreateRoomFormInput) {
    createRoom.mutate(
      {
        name: values.name.trim(),
        ...(values.budget
          ? { budget: values.budget, currency: values.currency ?? '$' }
          : {}),
      },
      {
        onSuccess: (room) => {
          toast.success('Room created');

          close(false);
          navigate(`/rooms/${room.id}`);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Name your room and optionally set a per0gift budget.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Room name"
            placeholder="Office Party 2026"
            autoFocus
            {...register('name')}
            error={errors.name?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Budget (optional)"
              type="number"
              min={1}
              placeholder="500"
              {...register('budget')}
              error={errors.budget?.message}
            />
            <SelectField
              control={control}
              name="currency"
              label="Currency"
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              error={errors.currency?.message}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
