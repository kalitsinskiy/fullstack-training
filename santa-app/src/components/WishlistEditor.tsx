import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { WishlistSchema, type WishlistInput } from "../schemas/wishlist";

type WishlistFormValues = z.input<typeof WishlistSchema>;

interface WishlistEditorProps {
  roomId: string;
}

const fieldClass =
  "focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function WishlistEditor({ roomId }: WishlistEditorProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const wishlistKey = ["rooms", roomId, "wishlist", "me"];

  const { data, isLoading } = useQuery({
    queryKey: wishlistKey,
    queryFn: async ({ signal }) => {
      try {
        const wl = await api.get<WishlistInput>(
          `/rooms/${roomId}/wishlist/${userId}`,
          { signal },
        );
        return { items: wl.items };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return { items: [] };
        throw err;
      }
    },
    enabled: !!userId,
    retry: false,
  });

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WishlistFormValues, unknown, WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    values: data && data.items.length > 0 ? { items: data.items } : { items: [{ name: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const save = useMutation({
    mutationFn: (items: WishlistInput["items"]) =>
      api.post(`/rooms/${roomId}/wishlist`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKey });
    },
    onError: (err) => {
      setError("root.serverError", {
        message: err instanceof ApiError ? err.message : "Failed to save wishlist",
      });
    },
  });

  const removeItem = useMutation({
    mutationFn: (index: number) => {
      const items = getValues("items").filter((_, i) => i !== index);
      return api.post(`/rooms/${roomId}/wishlist`, { items });
    },
    onMutate: async (index: number) => {
      await queryClient.cancelQueries({ queryKey: wishlistKey });
      const previous = queryClient.getQueryData<WishlistInput>(wishlistKey);
      queryClient.setQueryData<WishlistInput>(wishlistKey, (old) => ({
        items: (old?.items ?? []).filter((_, i) => i !== index),
      }));
      return { previous };
    },
    onError: (_err, _index, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(wishlistKey, ctx.previous);
      alert("Remove failed — restored the item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKey });
    },
  });

  const submit = (form: WishlistInput) => save.mutate(form.items);

  if (isLoading) return <p className="text-text-muted">Loading wishlist…</p>;

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-card bg-surface p-card w-full max-w-lg shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Wishlist</h2>

      {errors.root?.serverError && (
        <p
          role="alert"
          className="text-danger mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {fields.map((field, idx) => {
          const removing = removeItem.isPending && removeItem.variables === idx;
          return (
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
                  onClick={() => {
                    remove(idx);
                    removeItem.mutate(idx);
                  }}
                  disabled={fields.length === 1 || removing}
                >
                  {removing ? "Removing…" : "Remove"}
                </Button>
              </div>
            </li>
          );
        })}
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
        <Button type="submit" disabled={isSubmitting || save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
