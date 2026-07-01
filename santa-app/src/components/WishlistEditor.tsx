import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { WishlistSchema, type WishlistInput } from "../schemas/wishlist";

type WishlistFormValues = z.input<typeof WishlistSchema>;

const fieldClass =
  "focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function WishlistEditor() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WishlistFormValues, unknown, WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: { items: [{ name: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const submit = (data: WishlistInput) => {
    // Lesson 09 wires PUT /api/rooms/:id/wishlist — log for now.
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-card bg-surface p-card w-full max-w-lg shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Wishlist</h2>

      <ul className="flex flex-col gap-4">
        {fields.map((field, idx) => (
          <li key={field.id} className="flex flex-col gap-2 border-b border-gray-100 pb-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${field.id}-name`}
                className="text-text-muted text-sm font-medium"
              >
                Name
              </label>
              <input
                id={`${field.id}-name`}
                aria-invalid={!!errors.items?.[idx]?.name}
                aria-describedby={
                  errors.items?.[idx]?.name ? `${field.id}-name-error` : undefined
                }
                className={fieldClass}
                {...register(`items.${idx}.name`)}
              />
              {errors.items?.[idx]?.name && (
                <p
                  id={`${field.id}-name-error`}
                  role="alert"
                  className="text-danger text-xs"
                >
                  {errors.items[idx]?.name?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${field.id}-url`}
                className="text-text-muted text-sm font-medium"
              >
                URL (optional)
              </label>
              <input
                id={`${field.id}-url`}
                aria-invalid={!!errors.items?.[idx]?.url}
                aria-describedby={
                  errors.items?.[idx]?.url ? `${field.id}-url-error` : undefined
                }
                className={fieldClass}
                {...register(`items.${idx}.url`)}
              />
              {errors.items?.[idx]?.url && (
                <p
                  id={`${field.id}-url-error`}
                  role="alert"
                  className="text-danger text-xs"
                >
                  {errors.items[idx]?.url?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${field.id}-priority`}
                className="text-text-muted text-sm font-medium"
              >
                Priority 1-5 (optional)
              </label>
              <input
                id={`${field.id}-priority`}
                type="number"
                min={1}
                max={5}
                aria-invalid={!!errors.items?.[idx]?.priority}
                aria-describedby={
                  errors.items?.[idx]?.priority
                    ? `${field.id}-priority-error`
                    : undefined
                }
                className={fieldClass}
                {...register(`items.${idx}.priority`, {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : Number(v),
                })}
              />
              {errors.items?.[idx]?.priority && (
                <p
                  id={`${field.id}-priority-error`}
                  role="alert"
                  className="text-danger text-xs"
                >
                  {errors.items[idx]?.priority?.message}
                </p>
              )}
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(idx)}
                disabled={fields.length === 1}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {errors.items?.root && (
        <p role="alert" className="text-danger mt-2 text-xs">
          {errors.items.root.message}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "", url: "", priority: undefined })}
        >
          + Add item
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
