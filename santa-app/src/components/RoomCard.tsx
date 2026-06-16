import { clsx } from "clsx";

type RoomCardProps =
  | {
      status: "open";
      name: string;
      code: string;
      participantCount: number;
      onJoin: () => void;
    }
  | {
      status: "drawn";
      name: string;
      code: string;
      participantCount: number;
      onView: () => void;
    }
  | { status: "closed"; name: string; code: string; participantCount: number };

export type { RoomCardProps };

const statusConfig = {
  open: { label: "Open", className: "bg-yellow-100 text-yellow-800" },
  drawn: { label: "Drawn", className: "bg-green-100 text-green-800" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600" },
} satisfies Record<
  RoomCardProps["status"],
  { label: string; className: string }
>;

export function RoomCard(props: RoomCardProps) {
  const { name, code, participantCount, status } = props;
  const badge = statusConfig[status];

  return (
    <article className="rounded-card bg-surface p-card @container shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex flex-col gap-3 @[22rem]:flex-row @[22rem]:items-center @[22rem]:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-brand text-lg font-semibold">{name}</h3>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-text-muted font-mono text-sm">Code: {code}</p>
          <p className="text-text-muted text-sm">
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </p>
        </div>

        {status === "open" && (
          <button
            type="button"
            onClick={props.onJoin}
            className="bg-brand hover:bg-brand-dark focus-visible:ring-brand self-start rounded-md px-4 py-1.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none @[22rem]:self-center"
          >
            Join
          </button>
        )}
        {status === "drawn" && (
          <button
            type="button"
            onClick={props.onView}
            className="bg-brand hover:bg-brand-dark focus-visible:ring-brand self-start rounded-md px-4 py-1.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none @[22rem]:self-center"
          >
            View
          </button>
        )}
      </div>
    </article>
  );
}
