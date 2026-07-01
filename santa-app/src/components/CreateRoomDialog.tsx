import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (roomName: string) =>
      api.post("/rooms", { name: roomName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setName("");
      setOpen(false);
    },
    onError: (err) => {
      alert(err instanceof ApiError ? err.message : "Failed to create room");
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Create room"
          title="Create room"
        >
          <span aria-hidden className="text-xl leading-none">
            +
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
          <DialogDescription>
            Give your room a name to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Office Party 2025"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
