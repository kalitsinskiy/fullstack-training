import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WishlistSchema, type WishlistInput } from "@/schemas/wishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WishlistEditor() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema) as Resolver<WishlistInput>,
    defaultValues: { items: [{ name: "", url: "", priority: undefined }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <form
      onSubmit={handleSubmit((data) => console.log(data))}
      className="flex flex-col gap-4"
    >
      <h3 className="text-lg font-semibold">Wishlist</h3>

      {fields.map((field, idx) => {
        const nameId = `wishlist-item-${idx}-name`;
        const urlId = `wishlist-item-${idx}-url`;
        const priorityId = `wishlist-item-${idx}-priority`;
        const nameErrorId = `${nameId}-error`;
        const urlErrorId = `${urlId}-error`;
        const priorityErrorId = `${priorityId}-error`;
        const itemErrors = errors.items?.[idx];

        return (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-md border border-gray-200 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Item {idx + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => remove(idx)}
                disabled={fields.length === 1}
              >
                Remove
              </Button>
            </div>

            <Label htmlFor={nameId}>Name *</Label>
            <Input
              id={nameId}
              type="text"
              placeholder="Gift name"
              aria-invalid={!!itemErrors?.name}
              aria-describedby={itemErrors?.name ? nameErrorId : undefined}
              {...register(`items.${idx}.name`)}
            />
            {itemErrors?.name && (
              <p id={nameErrorId} role="alert" className="text-danger text-sm">
                {itemErrors.name.message}
              </p>
            )}

            <Label htmlFor={urlId}>URL</Label>
            <Input
              id={urlId}
              type="url"
              placeholder="https://example.com/item"
              aria-invalid={!!itemErrors?.url}
              aria-describedby={itemErrors?.url ? urlErrorId : undefined}
              {...register(`items.${idx}.url`)}
            />
            {itemErrors?.url && (
              <p id={urlErrorId} role="alert" className="text-danger text-sm">
                {itemErrors.url.message}
              </p>
            )}

            <Label htmlFor={priorityId}>Priority (1–5)</Label>
            <Input
              id={priorityId}
              type="number"
              min={1}
              max={5}
              placeholder="e.g. 3"
              aria-invalid={!!itemErrors?.priority}
              aria-describedby={
                itemErrors?.priority ? priorityErrorId : undefined
              }
              {...register(`items.${idx}.priority`, {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {itemErrors?.priority && (
              <p
                id={priorityErrorId}
                role="alert"
                className="text-danger text-sm"
              >
                {itemErrors.priority.message}
              </p>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: "", url: "", priority: undefined })}
      >
        + Add item
      </Button>

      <Button type="submit">Save</Button>
    </form>
  );
}
