import { useOptimistic, useState } from "react";

interface GiftItem {
  id: string;
  name: string;
  bought: boolean;
}

type OptimisticItem = GiftItem & { saving?: boolean };

const INITIAL_ITEMS: GiftItem[] = [
  { id: "1", name: "Wireless headphones", bought: false },
  { id: "2", name: "Board game", bought: false },
  { id: "3", name: "Coffee beans", bought: false },
];

export function GifteeWishlist() {
  const [items, setItems] = useState<GiftItem[]>(INITIAL_ITEMS);

  const [optimisticItems, addOptimistic] = useOptimistic(
    items as OptimisticItem[],
    (current, patch: { id: string; bought: boolean }) =>
      current.map((it) =>
        it.id === patch.id ? { ...it, bought: patch.bought, saving: true } : it,
      ),
  );

  const toggleBought = async (id: string, next: boolean) => {
    addOptimistic({ id, bought: next });
    await new Promise((r) => setTimeout(r, 400));
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, bought: next } : it)),
    );
  };

  return (
    <div className="rounded-card bg-surface p-card w-full max-w-lg shadow-md">
      <h2 className="text-brand mb-1 text-2xl font-semibold">
        Giftee's wishlist
      </h2>
      <p className="text-text-muted mb-4 text-sm">
        A personal shopping scratchpad — "bought" marks are local and reset on
        reload.
      </p>

      <ul className="flex flex-col gap-2">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between border-b border-gray-100 py-2"
          >
            <form action={() => toggleBought(item.id, !item.bought)}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.bought}
                  disabled={item.saving}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                />
                <span
                  className={
                    item.bought ? "text-text-muted line-through" : "text-text-base"
                  }
                >
                  {item.name}
                </span>
              </label>
            </form>
            {item.saving && (
              <span className="text-text-muted text-xs">saving…</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
