import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateRoomResponse {
  id: string;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (name: string) =>
      api.post<CreateRoomResponse>("/rooms", { name, ownerId: user?.id }),
    onSuccess: (createdRoom) => {
      // §6: invalidate rooms list so RoomList auto-refreshes
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setRoomName("");
      onOpenChange(false);
      navigate(`/rooms/${createdRoom.id}`);
    },
    onError: (err) => setSubmitError((err as Error).message),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setRoomName("");
      setSubmitError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
        </DialogHeader>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {submitError}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-name" className="text-right">
              Room name
            </Label>
            <Input
              id="room-name"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && roomName.trim())
                  create.mutate(roomName.trim());
              }}
              className="col-span-3"
              autoFocus
              disabled={create.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!roomName.trim()) {
                setSubmitError("Room name is required");
                return;
              }
              create.mutate(roomName.trim());
            }}
            disabled={!roomName.trim() || create.isPending}
          >
            {create.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
