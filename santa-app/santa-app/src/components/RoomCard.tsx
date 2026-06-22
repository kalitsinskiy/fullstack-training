import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Button size="sm" onClick={props.onJoin}>
        Join
      </Button>
    );
  } else if (props.status === "drawn") {
    actionButton = (
      <Button variant="outline" size="sm" onClick={props.onView}>
        View
      </Button>
    );
  }

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardAction>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[props.status]}`}>
            {statusLabels[props.status]}
          </span>
        </CardAction>
        <CardDescription className="font-mono">{code}</CardDescription>
      </CardHeader>

      <CardContent className="text-muted-foreground text-sm">
        {participantCount} participants
        {expanded && (
          <div className="mt-3 border-t pt-3">
            <p><span className="font-medium text-foreground">Code:</span> <span className="font-mono">{code}</span></p>
            <p><span className="font-medium text-foreground">Participants:</span> {participantCount}</p>
            <p><span className="font-medium text-foreground">Status:</span> {statusLabels[props.status]}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Hide details" : "More details"}
        </Button>
        {actionButton}
      </CardFooter>
    </Card>
  );
}
