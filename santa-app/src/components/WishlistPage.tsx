import { useEffect } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { WishlistSchema, type WishlistInput } from "../schemas/wishlist";

interface WishlistItem {
  name: string;
  url?: string;
  priority?: number;
}

interface WishlistResponse {
  id: string;
  userId: string;
  roomId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface RoomResponse {
  id: string;
  name: string;
  inviteCode: string;
}

export function WishlistPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Need the room's inviteCode — the wishlist API uses it as the URL param
  const { data: room } = useQuery({
    queryKey: ["rooms", id],
    queryFn: ({ signal }) => api.get<RoomResponse>(`/rooms/${id}`, { signal }),
    enabled: !!id,
  });

  const roomCode = room?.inviteCode;

  // §5: load existing wishlist once we have roomCode and userId
  const { data: wishlistData } = useQuery({
    queryKey: ["rooms", id, "wishlist", "me"],
    queryFn: ({ signal }) =>
      api.get<WishlistResponse>(`/rooms/${roomCode}/wishlist/${user!.id}`, { signal }),
    enabled: !!roomCode && !!user?.id,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 1;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema) as Resolver<WishlistInput>,
    defaultValues: { items: [{ name: "", url: "", priority: undefined }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Sync query data → form whenever server data arrives
  useEffect(() => {
    if (!wishlistData) return;
    const loaded =
      wishlistData.items.length > 0
        ? wishlistData.items
        : [{ name: "", url: "", priority: undefined }];
    reset({
      items: loaded.map((item) => ({
        name: item.name,
        url: item.url ?? "",
        priority: item.priority,
      })),
    });
  }, [wishlistData, reset]);

  // §6: save wishlist — POST /rooms/:roomCode/wishlist with { userId, items }
  const saveWishlist = useMutation({
    mutationFn: (items: WishlistItem[]) =>
      api.post<WishlistResponse>(`/rooms/${roomCode}/wishlist`, {
        userId: user?.id,
        items,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id, "wishlist", "me"] });
    },
    onError: (err) => {
      setError("root.serverError", {
        message: (err as Error).message ?? "Failed to save wishlist",
      });
    },
  });

  const submit = async (data: WishlistInput) => {
    await saveWishlist.mutateAsync(
      data.items.map((item) => ({
        name: item.name,
        ...(item.url ? { url: item.url } : {}),
        ...(item.priority !== undefined ? { priority: item.priority } : {}),
      })),
    );
    setError("root.saveSuccess" as never, { message: "Wishlist saved" });
  };

  // §7: optimistic remove
  const removeItem = useMutation({
    mutationFn: (idx: number) => {
      const filtered = getValues("items")
        .filter((_, i) => i !== idx)
        .map((item) => ({
          name: item.name,
          ...(item.url ? { url: item.url } : {}),
          ...(item.priority !== undefined ? { priority: item.priority } : {}),
        }));
      return api.post<WishlistResponse>(`/rooms/${roomCode}/wishlist`, {
        userId: user?.id,
        items: filtered,
      });
    },
    onMutate: async (idx) => {
      await queryClient.cancelQueries({ queryKey: ["rooms", id, "wishlist", "me"] });
      const previous = queryClient.getQueryData<WishlistResponse>(["rooms", id, "wishlist", "me"]);
      if (previous) {
        queryClient.setQueryData<WishlistResponse>(["rooms", id, "wishlist", "me"], {
          ...previous,
          items: previous.items.filter((_, i) => i !== idx),
        });
      }
      remove(idx);
      return { previous };
    },
    onError: (_err, _idx, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["rooms", id, "wishlist", "me"], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id, "wishlist", "me"] });
    },
  });

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-xs tracking-[0.22em] text-(--muted) uppercase">Wishlist</p>
        <h2 className="mt-2 text-3xl font-semibold text-(--text)">Edit Wishlist</h2>
        <p className="mt-2 text-sm text-(--muted)">
          Add gift ideas for this room. URL and priority are optional.
        </p>
      </header>

      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {errors.root?.serverError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.root.serverError.message}
          </div>
        )}

        {(errors.root as { saveSuccess?: { message?: string } })?.saveSuccess && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {(errors.root as { saveSuccess?: { message?: string } }).saveSuccess?.message}
          </div>
        )}

        {errors.items?.root && (
          <div role="alert" className="text-sm text-red-600">
            {errors.items.root.message}
          </div>
        )}

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <article
              key={field.id}
              className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-[1.6fr_1fr_160px_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`items-${idx}-name`}
                  className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
                >
                  Name *
                </Label>
                <Input
                  id={`items-${idx}-name`}
                  placeholder="Gift idea"
                  aria-invalid={!!errors.items?.[idx]?.name}
                  aria-describedby={errors.items?.[idx]?.name ? `items-${idx}-name-error` : undefined}
                  {...register(`items.${idx}.name`)}
                />
                {errors.items?.[idx]?.name && (
                  <span id={`items-${idx}-name-error`} role="alert" className="text-xs text-red-600">
                    {errors.items[idx]?.name?.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`items-${idx}-url`}
                  className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
                >
                  URL
                </Label>
                <Input
                  id={`items-${idx}-url`}
                  placeholder="https://..."
                  aria-invalid={!!errors.items?.[idx]?.url}
                  aria-describedby={errors.items?.[idx]?.url ? `items-${idx}-url-error` : undefined}
                  {...register(`items.${idx}.url`)}
                />
                {errors.items?.[idx]?.url && (
                  <span id={`items-${idx}-url-error`} role="alert" className="text-xs text-red-600">
                    {errors.items[idx]?.url?.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`items-${idx}-priority`}
                  className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
                >
                  Priority (1–5)
                </Label>
                <Input
                  id={`items-${idx}-priority`}
                  type="number"
                  min={1}
                  max={5}
                  placeholder="—"
                  aria-invalid={!!errors.items?.[idx]?.priority}
                  aria-describedby={errors.items?.[idx]?.priority ? `items-${idx}-priority-error` : undefined}
                  {...register(`items.${idx}.priority`)}
                />
                {errors.items?.[idx]?.priority && (
                  <span id={`items-${idx}-priority-error`} role="alert" className="text-xs text-red-600">
                    {errors.items[idx]?.priority?.message}
                  </span>
                )}
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  onClick={() => removeItem.mutate(idx)}
                  disabled={fields.length === 1 || removeItem.isPending}
                  variant="outline"
                  className="h-9 px-3 text-sm font-medium hover:bg-red-50"
                >
                  {removeItem.isPending && removeItem.variables === idx ? "Removing…" : "Remove"}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-4 text-sm font-medium"
            onClick={() => append({ name: "", url: "", priority: undefined })}
          >
            + Add item
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !roomCode}
            className="bg-brand hover:bg-brand-dark rounded-full px-4 text-sm font-semibold text-(--button-text)"
          >
            {isSubmitting ? "Saving..." : "Save wishlist"}
          </Button>
          <Button asChild variant="outline" className="rounded-full px-4 text-sm font-medium">
            <Link to={id ? `/rooms/${id}` : "/rooms"}>Back to room</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
