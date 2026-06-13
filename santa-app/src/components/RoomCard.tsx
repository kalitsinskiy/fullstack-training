import clsx from "clsx";

export interface RoomCardProps {
  name: string;
  code: string;
  memberCount: number;
  status: "pending" | "drawn" | "closed";
  onOpen: () => void;
}

const statusLabel: Record<RoomCardProps["status"], string> = {
  pending: "Pending",
  drawn: "Drawn",
  closed: "Closed",
};

const statusStyle: Record<RoomCardProps["status"], string> = {
  pending: "bg-green-100 text-green-800",
  drawn: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function RoomCard({
  name,
  code,
  memberCount,
  status,
  onOpen,
}: RoomCardProps) {
  return (
    <article className="rounded-card p-card @container bg-white shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex flex-col gap-3 @[22rem]:flex-row @[22rem]:items-center">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-semibold text-gray-900">{name}</span>
          <code className="font-mono text-xs text-gray-500">{code}</code>
          <span className="text-xs text-gray-500">{memberCount} members</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              statusStyle[status],
            )}
          >
            {statusLabel[status]}
          </span>

          <button
            type="button"
            onClick={onOpen}
            className="bg-brand hover:bg-brand-dark focus-visible:outline-brand rounded px-3 py-1.5 text-sm font-medium text-white transition-colors focus-visible:outline-2"
          >
            Open
          </button>
        </div>
      </div>
    </article>
  );
}
