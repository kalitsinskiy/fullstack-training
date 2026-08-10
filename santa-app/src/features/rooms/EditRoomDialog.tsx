import { RoomDetail } from '@/types/api';
import { useEditRoom } from './hooks';
import { useForm } from 'react-hook-form';
import { EditRoomFormInput, editRoomSchema, CURRENCIES } from '@/schemas/rooms';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
import { DateField } from '@/components/ui/date-field';
import { Button } from '@/components/ui/button';

interface Props {
  room: RoomDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoomDialog({ room, open, onOpenChange }: Props) {
  const edit = useEditRoom(room.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditRoomFormInput>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      name: room.name,
      budget: room.budget,
      currency: room.currency ?? '$',
      exchangeDate: room.exchangeDate ? new Date(room.exchangeDate) : undefined,
    },
  });

  function onSubmit(values: EditRoomFormInput) {
    edit.mutate(
      {
        name: values.name.trim(),
        ...(values.budget
          ? { budget: values.budget, currency: values.currency ?? '$' }
          : {}),
        ...(values.exchangeDate
          ? { exchangeDate: format(values.exchangeDate, 'yyyy-MM-dd') }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success('Room updated');
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit room</DialogTitle>
          <DialogDescription>
            Update the room name, gift budget and exchange date.
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

          <DateField
            control={control}
            name="exchangeDate"
            label="Gift exchange date"
            minDate={today}
            placeholder="No date set yet"
            error={errors.exchangeDate?.message}
          />

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
