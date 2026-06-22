import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

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
    <Card className="group [container-type:inline-size] rounded-3xl bg-(--surface) shadow-sm ring-(--border) transition [--card-spacing:--spacing(5)] hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="@container:(flex-row justify-between) flex flex-col items-start gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium tracking-[0.18em] uppercase">
            Room
          </p>
          <CardTitle className="mt-1 line-clamp-2 text-xl font-semibold break-words text-(--text)">
            {props.name}
          </CardTitle>
        </div>
        <span className="text-muted-foreground font-mono text-sm">
          {props.code}
        </span>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-3 text-sm text-(--text)">
          <span>{props.participantCount} members</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[props.status]}`}
          >
            {props.status}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-0 bg-transparent px-5 pt-0">
        <Button
          type="button"
          onClick={props.onOpen}
          className={`${actionClassName} h-11 min-w-[7rem] cursor-pointer rounded-full px-4 text-sm font-semibold text-(--button-text) focus-visible:ring-2`}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
