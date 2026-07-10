import { useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { wishlistFormSchema, type WishlistFormInput } from '@/schemas/wishlist';
import { cleanWishlistItems } from './helpers';
import { useSaveWishlist, useWishlist } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WishlistEditor({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const { data, isLoading } = useWishlist(roomId, userId);
  const hydratedKey = useRef('');
  const save = useSaveWishlist(roomId, userId);
  const { register, control, handleSubmit, reset } = useForm<WishlistFormInput>(
    {
      resolver: zodResolver(wishlistFormSchema),
      defaultValues: { items: [] },
    },
  );
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!data) return;

    const key = `${roomId}:${userId}`;

    if (hydratedKey.current === key) return;

    hydratedKey.current = key;

    reset({
      items: data.items.length
        ? data.items.map((value) => ({ value }))
        : [{ value: '' }],
    });
  }, [data, roomId, userId, reset]);

  async function onSubmit(values: WishlistFormInput) {
    try {
      await save.mutateAsync(
        cleanWishlistItems(values.items.map((i) => i.value)),
      );
      toast.success('Wishlist saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save your wishlist'));
    }
  }

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading your wishlist…</p>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder={`Gift item ${index + 1}`}
              {...register(`items.${index}.value`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove item"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: '' })}
        >
          <Plus className="size-4" /> Add Item
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save wishlist'}
        </Button>
      </div>
    </form>
  );
}
