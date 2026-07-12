import { RoomDetail } from '@/types/api';
import { useEditRoom } from './hooks';
import { useForm } from 'react-hook-form';
import {
  CreateRoomFormInput,
  createRoomSchema,
  CURRENCIES,
} from '@/schemas/rooms';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { SelectField } from '@/components/ui/select-field';
import { Button } from '@/components/ui/button';

interface Props {
  room: RoomDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoomDialog({ room, open, onOpenChange }: Props) {
  const edit = useEditRoom(room.id);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateRoomFormInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: room.name,
      budget: room.budget,
      currency: room.currency ?? '$',
    },
  });

  async function onSubmit(values: CreateRoomFormInput) {
    try {
      await edit.mutateAsync({
        name: values.name.trim(),
        ...(values.budget
          ? { budget: values.budget, currency: values.currency ?? '$' }
          : {}),
      });

      toast.success('Room updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update the room'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit room</DialogTitle>
          <DialogDescription>
            Update the room name and gift budget.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Room name"
            {...register('name')}
            error={errors.name?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Budget (optional)"
              type="number"
              min={1}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={edit.isPending}>
              {edit.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
