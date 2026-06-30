import { useEffect } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WishlistSchema, type WishlistInput } from '@/schemas/wishlist';
import { api, ApiError, getErrorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WishlistItem {
  name: string;
  url?: string;
  priority?: number;
}

interface ApiWishlist {
  items: WishlistItem[];
}

export function WishlistEditor({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['rooms', roomId, 'wishlist', 'me'];

  const { data: wishlistData } = useQuery({
    queryKey,
    queryFn: () =>
      user?.id
        ? api.get<ApiWishlist>(`/api/rooms/${roomId}/wishlist/${user.id}`)
        : Promise.resolve(null),
    enabled: !!user?.id,
    // 404 means no wishlist yet — treat as empty
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 3;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema) as Resolver<WishlistInput>,
    defaultValues: { items: [{ name: '', url: '', priority: undefined }] },
  });

  useEffect(() => {
    if (wishlistData && !isDirty) {
      reset({
        items:
          wishlistData.items.length > 0
            ? wishlistData.items.map((i) => ({ name: i.name, url: i.url ?? '', priority: i.priority }))
            : [{ name: '', url: '', priority: undefined }],
      });
    }
  }, [wishlistData, reset, isDirty]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const save = useMutation({
    mutationFn: (data: WishlistInput) =>
      api.post<ApiWishlist>(`/api/rooms/${roomId}/wishlist`, { items: data.items }),
    onSuccess: (saved) => {
      qc.setQueryData(queryKey, saved);
      reset({
        items: saved.items.length > 0
          ? saved.items.map((i) => ({ name: i.name, url: i.url ?? '', priority: i.priority }))
          : [{ name: '', url: '', priority: undefined }],
      });
    },
  });

  // Optimistic remove — updates cache instantly, rolls back on error
  const removeItem = useMutation({
    mutationFn: async (idx: number) => {
      const cached = qc.getQueryData<ApiWishlist>(queryKey);
      const filtered = (cached?.items ?? []).filter((_, i) => i !== idx);
      return api.post<ApiWishlist>(`/api/rooms/${roomId}/wishlist`, { items: filtered });
    },
    onMutate: async (idx) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData<ApiWishlist>(queryKey);
      qc.setQueryData<ApiWishlist>(queryKey, (old) => ({
        items: (old?.items ?? []).filter((_, i) => i !== idx),
      }));
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(queryKey, ctx?.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => save.mutate(data))}
      className="flex flex-col gap-4"
    >
      {fields.map((field, idx) => {
        const nameId = `wishlist-item-${idx}-name`;
        const urlId = `wishlist-item-${idx}-url`;
        const priorityId = `wishlist-item-${idx}-priority`;
        const itemErrors = errors.items?.[idx];
        const isRemoving = removeItem.isPending && removeItem.variables === idx;

        return (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-md border border-gray-200 p-3"
            style={{ opacity: isRemoving ? 0.4 : 1 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Item {idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={fields.length === 1 || isRemoving}
                onClick={() => {
                  remove(idx);
                  removeItem.mutate(idx);
                }}
              >
                {isRemoving ? '…' : 'Remove'}
              </Button>
            </div>

            <Label htmlFor={nameId}>Name *</Label>
            <Input
              id={nameId}
              type="text"
              placeholder="Gift name"
              aria-invalid={!!itemErrors?.name}
              {...register(`items.${idx}.name`)}
            />
            {itemErrors?.name && (
              <p role="alert" className="text-danger text-sm">{itemErrors.name.message}</p>
            )}

            <Label htmlFor={urlId}>URL</Label>
            <Input
              id={urlId}
              type="url"
              placeholder="https://example.com/item"
              aria-invalid={!!itemErrors?.url}
              {...register(`items.${idx}.url`)}
            />
            {itemErrors?.url && (
              <p role="alert" className="text-danger text-sm">{itemErrors.url.message}</p>
            )}

            <Label htmlFor={priorityId}>Priority (1–5)</Label>
            <Input
              id={priorityId}
              type="number"
              min={1}
              max={5}
              placeholder="e.g. 3"
              aria-invalid={!!itemErrors?.priority}
              {...register(`items.${idx}.priority`, {
                setValueAs: (v) => (v === '' ? undefined : Number(v)),
              })}
            />
            {itemErrors?.priority && (
              <p role="alert" className="text-danger text-sm">{itemErrors.priority.message}</p>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: '', url: '', priority: undefined })}
      >
        + Add item
      </Button>

      {save.isError && (
        <p className="text-sm text-red-600">{getErrorMessage(save.error)}</p>
      )}

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
