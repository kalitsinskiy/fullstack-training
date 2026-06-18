import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Field } from '../ui/Field';
import { Button } from '../ui/button';
import { api, ApiError } from '@/services/api';
import type { WishlistItem, Wishlist } from '@/types/api';
import { WishlistSchema, type WishlistInput } from '@/schemas/wishlist';
import { useAuth } from '@/hooks/useAuth';

interface WishlistEditorProps {
  roomId: string;
  disabled?: false;
}

export function WishlistEditor({ roomId, disabled = false }: WishlistEditorProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const queryClient = useQueryClient();
  const wishlistKey = ['rooms', roomId, 'wishlist', userId] as const;

  function toWishlistPayload(
    items: { name: string; url?: string; priority?: number }[]
  ): WishlistItem[] {
    return items.map((item) => ({
      name: item.name.trim(),
      ...(item.url && item.url.trim() ? { url: item.url.trim() } : {}),
      ...(item.priority != null ? { priority: item.priority } : {}),
    }));
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: wishlistKey,
    queryFn: async ({ signal }) => {
      try {
        return await api.get<{ items: WishlistItem[] }>(`/api/rooms/${roomId}/wishlist/${userId}`, {
          signal,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return { roomId, userId, items: [] } as Wishlist;
        }

        throw err;
      }
    },
    enabled: !!roomId && !!userId,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: { items: [{ name: '', url: '', priority: 1 }] },
  });

  const { fields, append } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (data) {
      reset({ items: data.items.length ? data.items : [{ name: '' }] });
    }
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (items: WishlistInput['items']) =>
      api.post<Wishlist>(`/api/rooms/${roomId}/wishlist`, { items: toWishlistPayload(items) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
    onError: (err) =>
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Could not save wishlist',
      }),
  });

  const removeItem = useMutation({
    mutationFn: (items: WishlistItem[]) =>
      api.post<Wishlist>(`/api/rooms/${roomId}/wishlist`, { items: toWishlistPayload(items) }),
    onMutate: async (nextItems) => {
      await queryClient.cancelQueries({ queryKey: wishlistKey });
      const previous = queryClient.getQueryData<Wishlist>(wishlistKey);

      queryClient.setQueryData<Wishlist>(wishlistKey, (old) =>
        old ? { ...old, items: nextItems } : old
      );

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(wishlistKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
  });

  const submit = (formData: WishlistInput) => save.mutate(formData.items);

  if (isLoading) return <p className="text-muted-foreground">Loading wishlist...</p>;
  if (isError)
    return (
      <p role="alert" className="text-red-500">
        {(error as Error).message}
      </p>
    );

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      {errors.root?.serverError && (
        <p role="alert" className="text-[0.85rem] text-red-500">
          {errors.root.serverError.message}
        </p>
      )}
      {errors.items?.root && (
        <p role="alert" className="text-[0.85rem] text-red-500">
          {errors.items.root.message}
        </p>
      )}
      {disabled && (
        <p className="text-muted-foreground text-sm">This room is closed — wishlists are locked.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field, idx) => (
          <fieldset
            key={field.id}
            className="rounded-card border-border flex flex-col gap-3 border p-4"
          >
            <legend className="text-muted-foreground text-sm">Item {idx + 1}</legend>

            <Field
              label="Name"
              placeholder="E.g. Lego Car"
              {...register(`items.${idx}.name`)}
              disabled={disabled}
              error={errors.items?.[idx]?.name?.message}
            />

            <Field
              label="URL (optional)"
              placeholder="https://..."
              {...register(`items.${idx}.url`)}
              disabled={disabled}
              error={errors.items?.[idx]?.url?.message}
            />

            <Field
              label="Priority (1-5, optional)"
              type="number"
              min={1}
              max={5}
              {...register(`items.${idx}.priority`, {
                setValueAs: (v) => (v === '' ? undefined : Number(v)),
              })}
              disabled={disabled}
              error={errors.items?.[idx]?.priority?.message}
            />

            {!disabled && (
              <Button
                type="button"
                variant={fields.length <= 1 ? 'outline' : 'destructive'}
                size="sm"
                onClick={() => {
                  const next = getValues('items').filter((_, i) => i !== idx) as WishlistItem[];
                  removeItem.mutate(next);
                }}
                disabled={fields.length === 1 || removeItem.isPending}
                className="self-start"
              >
                Remove
              </Button>
            )}
          </fieldset>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', url: '', priority: 1 })}
          disabled={disabled}
        >
          + Add item
        </Button>
        <Button type="submit" disabled={disabled || isSubmitting || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
