import { useEffect } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
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
  const api = useApi();

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema) as Resolver<WishlistInput>,
    defaultValues: { items: [{ name: "", url: "", priority: undefined }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!id || !user?.id) return;

    const loadData = async () => {
      try {
        const room = await api.get<RoomResponse>(`/rooms/${id}`);

        try {
          const wishlist = await api.get<WishlistResponse>(
            `/rooms/${room.inviteCode}/wishlist/${user.id}`,
          );

          const loaded = wishlist.items.length > 0 ? wishlist.items : [{ name: "", url: "", priority: undefined }];
          reset({
            items: loaded.map((item) => ({
              name: item.name,
              url: item.url ?? "",
              priority: item.priority,
            })),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message.toLowerCase() : "";
          if (!message.includes("not found")) {
            setError("root.serverError", {
              message: err instanceof Error ? err.message : "Failed to load wishlist",
            });
          }
        }
      } catch (err) {
        setError("root.serverError", {
          message: err instanceof Error ? err.message : "Failed to load room",
        });
      }
    };

    void loadData();
  }, [api, id, user?.id, reset, setError]);

  const submit = async (data: WishlistInput) => {
    try {
      const room = await api.get<RoomResponse>(`/rooms/${id}`);
      await api.post<WishlistResponse>(`/rooms/${room.inviteCode}/wishlist`, {
        userId: user?.id,
        items: data.items.map((item) => ({
          name: item.name,
          ...(item.url ? { url: item.url } : {}),
          ...(item.priority !== undefined ? { priority: item.priority } : {}),
        })),
      });
      setError("root.saveSuccess" as never, { message: "Wishlist saved" });
    } catch (err) {
      setError("root.serverError", {
        message: err instanceof Error ? err.message : "Failed to save wishlist",
      });
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-xs tracking-[0.22em] text-(--muted) uppercase">
          Wishlist
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-(--text)">
          Edit Wishlist
        </h2>
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
                  onClick={() => remove(idx)}
                  disabled={fields.length === 1}
                  variant="outline"
                  className="h-9 px-3 text-sm font-medium hover:bg-red-50"
                >
                  Remove
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
            disabled={isSubmitting}
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
