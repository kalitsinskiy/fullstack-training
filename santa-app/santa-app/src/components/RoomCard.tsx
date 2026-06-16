import { useState } from "react";

type RoomCardProps =
  | { status: "open"; name: string; code: string; participantCount: number; onJoin: () => void }
  | { status: "drawn"; name: string; code: string; participantCount: number; onView: () => void }
  | { status: "closed"; name: string; code: string; participantCount: number };

const statusStyles: Record<RoomCardProps["status"], string> = {
  open: "bg-green-100 text-green-800",
  drawn: "bg-blue-100 text-blue-800",
  closed: "bg-violet-100 text-violet-800",
};

const statusLabels: Record<RoomCardProps["status"], string> = {
  open: "Open",
  drawn: "Drawn",
  closed: "Closed",
};

export function RoomCard(props: RoomCardProps) {
  const { name, code, participantCount } = props;
  const [expanded, setExpanded] = useState(false);

  let actionButton: React.ReactNode = null;
  if (props.status === "open") {
    actionButton = (
      <button
        type="button"
        onClick={props.onJoin}
        className="bg-brand hover:bg-brand-dark rounded-md px-4 py-2 font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        Join
      </button>
    );
  } else if (props.status === "drawn") {
    actionButton = (
      <button
        type="button"
        onClick={props.onView}
        className="bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        View
      </button>
    );
  }

  return (
    <article className="bg-surface @container rounded-lg p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[props.status]}`}
            >
              {statusLabels[props.status]}
            </span>
          </div>
          <p className="text-text/70 font-mono text-sm">{code}</p>
          <p className="text-text/70 text-sm">{participantCount} participants</p>
        </div>

        <div className="flex flex-col items-start gap-2 @sm:items-end">
          {actionButton}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-text/50 hover:text-text text-xs underline transition-colors"
          >
            {expanded ? "Hide details" : "More details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-text/10 mt-3 border-t pt-3 text-sm">
          <p>
            <span className="font-medium">Code:</span>{" "}
            <span className="font-mono">{code}</span>
          </p>
          <p>
            <span className="font-medium">Participants:</span> {participantCount}
          </p>
          <p>
            <span className="font-medium">Status:</span> {statusLabels[props.status]}
          </p>
        </div>
      )}
    </article>
  );
}
