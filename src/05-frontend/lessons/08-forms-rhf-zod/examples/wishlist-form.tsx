/**
 * WishlistForm — dynamic field array with useFieldArray
 *
 * Patterns demonstrated:
 *   - z.array(z.object(...)) schema
 *   - useFieldArray to add/remove rows
 *   - using `field.id` as React key (NEVER the index)
 *   - per-row error messages via errors.items?.[idx]?.field?.message
 *   - z.coerce.number() — input.value is always string
 */

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schema ----

const WishlistSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Required').max(80),
        url: z.string().url('Invalid URL').optional().or(z.literal('')),
        priority: z.coerce.number().int().min(1).max(5).optional(),
      }),
    )
    .min(1, 'Add at least one item')
    .max(20, 'Up to 20 items'),
});

type WishlistInput = z.infer<typeof WishlistSchema>;

// ---- Component ----

export default function WishlistFormDemo() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: {
      items: [{ name: '', url: '', priority: 3 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const submit = async (data: WishlistInput) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Wishlist saved:', data);
    alert(`Saved ${data.items.length} item(s) — check the console`);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}
    >
      <h2>Wishlist</h2>

      {errors.items?.root && (
        <div role="alert" style={{ color: '#b91c1c' }}>{errors.items.root.message}</div>
      )}

      {fields.map((field, idx) => (
        <fieldset
          key={field.id}                    /* RHF's stable id, never `idx` */
          style={{ display: 'grid', gap: 6, padding: 12, marginBottom: 8, border: '1px solid #ddd', borderRadius: 6 }}
        >
          <legend>Item {idx + 1}</legend>

          <label>
            Name
            <input
              {...register(`items.${idx}.name`)}
              style={{ display: 'block', width: '100%', padding: 6 }}
            />
          </label>
          {errors.items?.[idx]?.name && (
            <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
              {errors.items[idx]?.name?.message}
            </span>
          )}

          <label>
            URL (optional)
            <input
              {...register(`items.${idx}.url`)}
              placeholder="https://…"
              style={{ display: 'block', width: '100%', padding: 6 }}
            />
          </label>
          {errors.items?.[idx]?.url && (
            <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
              {errors.items[idx]?.url?.message}
            </span>
          )}

          <label>
            Priority (1-5, optional)
            <input
              type="number"
              min={1}
              max={5}
              {...register(`items.${idx}.priority`)}
              style={{ display: 'block', width: 80, padding: 6 }}
            />
          </label>
          {errors.items?.[idx]?.priority && (
            <span role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
              {errors.items[idx]?.priority?.message}
            </span>
          )}

          <button type="button" onClick={() => remove(idx)} disabled={fields.length === 1}>
            Remove
          </button>
        </fieldset>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => append({ name: '', url: '', priority: 3 })}
          disabled={fields.length >= 20}
        >
          + Add item
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save wishlist'}
        </button>
      </div>
    </form>
  );
}
