export type RoomStatus = "pending" | "drawn" | "closed";

interface RoomCardProps {
  name: string;
  code: string;
  memberCount: number;
  status: RoomStatus;
  onOpen: () => void;
}

const statusStyles: Record<RoomStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  drawn: "bg-blue-100 text-blue-800",
  closed: "bg-violet-100 text-violet-800",
};

const statusLabels: Record<RoomStatus, string> = {
  pending: "Pending",
  drawn: "Drawn",
  closed: "Closed",
};

export function RoomCard({
  name,
  code,
  memberCount,
  status,
  onOpen,
}: RoomCardProps) {
  return (
    <article className="bg-surface @container rounded-lg p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>
          <p className="text-text/70 font-mono text-sm">{code}</p>
          <p className="text-text/70 text-sm">{memberCount} members</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="bg-brand hover:bg-brand-dark focus-visible:outline-brand rounded-md px-4 py-2 font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open
        </button>
      </div>
    </article>
  );
}
