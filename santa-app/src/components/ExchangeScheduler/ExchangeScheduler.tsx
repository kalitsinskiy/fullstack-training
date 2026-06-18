import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field } from '../ui/Field';
import { Button } from '../ui/button';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { ExchangeSchema, type ExchangeInput } from '@/schemas/rooms';
import { toLocalInput } from '@/utils/stringTransformer';
import { FormError } from '../ui/FormError';
import { Heading } from '../ui/Heading';

interface ExchangeSchedulerProps {
  room: Room;
}

export function ExchangeScheduler({ room }: ExchangeSchedulerProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExchangeInput>({
    resolver: zodResolver(ExchangeSchema),
    defaultValues: {
      exchangeDate: toLocalInput(room.exchangeDate),
      exchangePlace: room.exchangePlace ?? '',
    },
  });

  const save = useMutation({
    mutationFn: (data: ExchangeInput) =>
      api.patch<Room>(`/api/rooms/${room.id}`, {
        exchangeDate: new Date(data.exchangeDate).toISOString(),
        exchangePlace: data.exchangePlace.trim(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', room.id] }),
    onError: (err) =>
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Could not save the exchange details.',
      }),
  });

  const submit = (data: ExchangeInput) => save.mutate(data);

  return (
    <section className="rounded-card border-border flex flex-col gap-3 border p-6">
      <Heading>Gift exchange</Heading>

      <FormError>{errors.root?.serverError.message}</FormError>

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
        <Field
          label="Date & Time"
          type="datetime-local"
          {...register('exchangeDate')}
          error={errors.exchangeDate?.message}
        />
        <Field
          label="Place"
          placeholder="e.g. Office, 2nd floor, room 220"
          {...register('exchangePlace')}
          error={errors.exchangePlace?.message}
        />
        <Button type="submit" disabled={save.isPending} className="self-start">
          {save.isPending ? 'Saving…' : room.exchangeDate ? 'Update exchange' : 'Set exchange'}
        </Button>
      </form>
    </section>
  );
}
