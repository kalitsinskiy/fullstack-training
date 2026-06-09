import type { MouseEventHandler } from "react";

export type RoomStatus = "pending" | "drawn" | "closed";

interface RoomCardProps {
  name: string;
  code: string;
  memberCount: number;
  status: RoomStatus;
  onOpen: MouseEventHandler<HTMLButtonElement>;
}

const statusStyles: Record<RoomStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  drawn: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-100 text-slate-700",
};

export default function RoomCard({
  name,
  code,
  memberCount,
  status,
  onOpen,
}: RoomCardProps) {
  return (
    <article className="group [container-type:inline-size] rounded-3xl bg-(--surface) shadow-sm ring-1 ring-(--border) transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="@container:(flex-row justify-between) flex flex-col items-center gap-4 p-5">
        <div className="min-w-0 flex-auto space-y-4">
          <div className="@container:(flex-row justify-between) flex flex-col items-center gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-[0.18em] text-(--muted) uppercase">
                Room
              </p>
              <h3 className="mt-1 truncate text-xl font-semibold text-(--text)">
                {name}
              </h3>
            </div>
            <span className="font-mono text-sm text-(--muted)">{code}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-(--text)">
            <span>{memberCount} members</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
            >
              {status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="bg-brand hover:bg-brand-dark focus-visible:ring-brand inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full px-4 text-sm font-semibold text-(--button-text) transition focus:outline-none focus-visible:ring-2"
        >
          Open
        </button>
      </div>
    </article>
  );
}
