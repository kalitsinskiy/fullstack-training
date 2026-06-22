import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface RoomResponse {
  id: string;
  name: string;
  inviteCode: string;
}

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

interface EditableWishlistItem {
  name: string;
  url: string;
  priority: string;
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Unexpected error";
}

export function WishlistPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const api = useApi();

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [items, setItems] = useState<EditableWishlistItem[]>([
    { name: "", url: "", priority: "" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) {
        if (isMounted) {
          setError("Room ID is missing in the route.");
          setIsLoading(false);
        }
        return;
      }

      if (!user?.id) {
        if (isMounted) {
          setError("User must be signed in to edit wishlist.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setSaveMessage(null);

        const roomData = await api.get<RoomResponse>(`/rooms/${id}`);
        if (!isMounted) {
          return;
        }
        setRoom(roomData);

        try {
          const wishlist = await api.get<WishlistResponse>(
            `/rooms/${roomData.inviteCode}/wishlist/${user.id}`,
          );

          if (!isMounted) {
            return;
          }

          if (wishlist.items.length === 0) {
            setItems([{ name: "", url: "", priority: "" }]);
          } else {
            setItems(
              wishlist.items.map((item) => ({
                name: item.name,
                url: item.url ?? "",
                priority:
                  typeof item.priority === "number"
                    ? String(item.priority)
                    : "",
              })),
            );
          }
        } catch (innerError) {
          if (!isMounted) {
            return;
          }

          const message = parseErrorMessage(innerError).toLowerCase();
          if (message.includes("not found")) {
            setItems([{ name: "", url: "", priority: "" }]);
          } else {
            throw innerError;
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(parseErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [api, id, user?.id]);

  const updateItem = (
    index: number,
    key: keyof EditableWishlistItem,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      { name: "", url: "", priority: "" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) => {
      const nextItems = currentItems.filter(
        (_, itemIndex) => itemIndex !== index,
      );
      return nextItems.length > 0
        ? nextItems
        : [{ name: "", url: "", priority: "" }];
    });
  };

  const handleSave = async () => {
    if (!room?.inviteCode || !user?.id) {
      setError("Missing room or user context");
      return;
    }

    const normalizedItems = items
      .map((item) => ({
        name: item.name.trim(),
        url: item.url.trim(),
        priority: item.priority.trim(),
      }))
      .filter((item) => item.name.length > 0)
      .map((item) => ({
        name: item.name,
        ...(item.url.length > 0 ? { url: item.url } : {}),
        ...(item.priority.length > 0
          ? { priority: Number.parseInt(item.priority, 10) }
          : {}),
      }))
      .filter(
        (item) =>
          item.priority === undefined ||
          (Number.isInteger(item.priority) && item.priority >= 0),
      );

    try {
      setIsSaving(true);
      setError(null);
      setSaveMessage(null);

      await api.post<WishlistResponse>(`/rooms/${room.inviteCode}/wishlist`, {
        userId: user.id,
        items: normalizedItems,
      });

      setSaveMessage("Wishlist saved");
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-sm text-(--muted)">Loading wishlist...</p>
      </section>
    );
  }

  if (error && !room) {
    return (
      <section className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow">
        <h2 className="text-xl font-semibold">Could not load wishlist page</h2>
        <p className="text-sm">{error}</p>
        <Link
          to="/rooms"
          className="inline-flex rounded-full border border-red-300 px-4 py-2 text-sm font-medium transition hover:bg-red-100"
        >
          Back to rooms
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-xs tracking-[0.22em] text-(--muted) uppercase">
          Wishlist
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-(--text)">
          {room?.name ?? "Room"}
        </h2>
        <p className="mt-2 text-sm text-(--muted)">
          Add gift ideas for this room. Empty name rows are ignored when saving.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {saveMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => (
          <article
            key={`item-${index}`}
            className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-[1.6fr_1fr_160px_auto]"
          >
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`wishlist-name-${index}`}
                className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
              >
                Name
              </Label>
              <Input
                id={`wishlist-name-${index}`}
                value={item.name}
                onChange={(event) =>
                  updateItem(index, "name", event.target.value)
                }
                placeholder="Gift idea"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`wishlist-url-${index}`}
                className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
              >
                URL
              </Label>
              <Input
                id={`wishlist-url-${index}`}
                value={item.url}
                onChange={(event) =>
                  updateItem(index, "url", event.target.value)
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`wishlist-priority-${index}`}
                className="text-muted-foreground text-xs tracking-[0.15em] uppercase"
              >
                Priority
              </Label>
              <Input
                id={`wishlist-priority-${index}`}
                value={item.priority}
                onChange={(event) =>
                  updateItem(index, "priority", event.target.value)
                }
                placeholder="0"
                inputMode="numeric"
              />
            </div>

            <div className="flex items-end justify-end">
              <Button
                type="button"
                onClick={() => removeItem(index)}
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
          onClick={addItem}
          variant="outline"
          className="rounded-full px-4 text-sm font-medium"
        >
          Add item
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand hover:bg-brand-dark rounded-full px-4 text-sm font-semibold text-(--button-text)"
        >
          {isSaving ? "Saving..." : "Save wishlist"}
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-full px-4 text-sm font-medium"
        >
          <Link to={room ? `/rooms/${room.id}` : "/rooms"}>Back to room</Link>
        </Button>
      </div>
    </section>
  );
}
