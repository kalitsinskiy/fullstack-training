import { useState } from "react";
import clsx from "clsx";

export type RoomCardProps =
  | {
      status: "pending";
      name: string;
      code: string;
      memberCount: number;
      onOpen: () => void;
    }
  | {
      status: "drawn";
      name: string;
      code: string;
      memberCount: number;
      onView: () => void;
    }
  | { status: "closed"; name: string; code: string; memberCount: number };

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

export default function RoomCard(props: RoomCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { name, code, memberCount, status } = props;

  return (
    <article className="rounded-card p-card @container bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
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

          {props.status === "pending" && (
            <button
              type="button"
              onClick={props.onOpen}
              className="bg-brand hover:bg-brand-dark focus-visible:outline-brand rounded px-3 py-1.5 text-sm font-medium text-white transition-colors focus-visible:outline-2"
            >
              Join
            </button>
          )}

          {props.status === "drawn" && (
            <button
              type="button"
              onClick={props.onView}
              className="bg-brand hover:bg-brand-dark focus-visible:outline-brand rounded px-3 py-1.5 text-sm font-medium text-white transition-colors focus-visible:outline-2"
            >
              View
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            {expanded ? "Less" : "More"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-500">
          <p>
            Code: <span className="font-mono">{code}</span>
          </p>
          <p>Status: {statusLabel[status]}</p>
          <p>{memberCount} participants</p>
        </div>
      )}
    </article>
  );
}
