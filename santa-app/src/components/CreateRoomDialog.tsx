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
import { useApi } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";

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
  const api = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmedName = roomName.trim();

    if (!trimmedName) {
      setSubmitError("Room name is required");
      return;
    }

    if (!user?.id) {
      setSubmitError("You must be signed in to create a room");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const createdRoom = await api.post<CreateRoomResponse>("/rooms", {
        name: trimmedName,
        ownerId: user.id,
      });

      setRoomName("");
      onOpenChange(false);
      navigate(`/rooms/${createdRoom.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create room",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setRoomName("");
      setSubmitError(null);
    }
    onOpenChange(newOpen);
  };

  const isCreateDisabled = roomName.trim().length === 0 || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
        </DialogHeader>
        {submitError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {submitError}
          </div>
        ) : null}
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
              className="col-span-3"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreateDisabled}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
