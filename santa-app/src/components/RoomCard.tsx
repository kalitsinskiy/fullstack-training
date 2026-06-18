export type RoomStatus = "open" | "drawn" | "closed";
export interface RoomCardProps {
  status: RoomStatus;
  name: string;
  code: string;
  participantCount: number;
  onOpen: () => void;
}

const statusStyles: Record<RoomStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  drawn: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-100 text-slate-700",
};

export default function RoomCard(props: RoomCardProps) {
  const actionLabel = props.status === "drawn" ? "View" : "Open";
  const actionClassName =
    props.status === "drawn"
      ? "focus-visible:ring-brand bg-brand-secondary hover:bg-brand-secondary-dark"
      : "bg-brand hover:bg-brand-dark focus-visible:ring-brand";

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
                {props.name}
              </h3>
            </div>
            <span className="font-mono text-sm text-(--muted)">
              {props.code}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-(--text)">
            <span>{props.participantCount} members</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[props.status]}`}
            >
              {props.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={props.onOpen}
          className={`${actionClassName} inline-flex h-11 min-w-[7rem] cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold text-(--button-text) transition focus:outline-none focus-visible:ring-2`}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
