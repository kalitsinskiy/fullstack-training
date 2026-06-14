import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '../ui/Field';
import { Button } from '../ui/button';
import { WishlistSchema, type WishlistInput } from '@/schemas/wishlist';

export function WishlistEditor() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: { items: [{ name: '', url: '', priority: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const submit = (data: WishlistInput) => {
    console.log('Wishlist:', data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      {errors.items?.root && (
        <p role="alert" className="text-[0.85rem] text-red-500">
          {errors.items.root.message}
        </p>
      )}
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
            error={errors.items?.[idx]?.name?.message}
          />

          <Field
            label="URL (optional)"
            placeholder="https://..."
            {...register(`items.${idx}.url`)}
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
            error={errors.items?.[idx]?.priority?.message}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => remove(idx)}
            disabled={fields.length === 1}
            className="self-start"
          >
            Remove
          </Button>
        </fieldset>
      ))}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', url: '', priority: 1 })}
        >
          + Add item
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
