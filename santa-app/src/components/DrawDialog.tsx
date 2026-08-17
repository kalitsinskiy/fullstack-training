import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Wand2 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import 'react-day-picker/style.css';
import '@/styles/calendar.css';

interface DrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraw: (exchangeDate: string) => void;
  isLoading: boolean;
  participantCount: number;
}

export function DrawDialog({
  open,
  onOpenChange,
  onDraw,
  isLoading,
  participantCount,
}: DrawDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleConfirm = () => {
    if (selectedDate) {
      onDraw(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const canDraw = participantCount >= 3;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          className="gap-2 w-full"
          disabled={!canDraw || isLoading}
          title={!canDraw ? 'Need at least 3 participants' : 'Run the draw'}
        >
          <Wand2 className="size-4" /> Draw names
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">Set gift exchange date</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Choose the date when participants will exchange gifts.
          </Dialog.Description>

          <div className="mt-6 space-y-4">
            <div className="santa-cal">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                weekStartsOn={1}
                disabled={{ before: new Date() }}
              />
            </div>

            {selectedDate && (
              <p className="text-center text-sm font-medium">
                {format(selectedDate, 'EEE, d MMM yyyy')}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDate || isLoading}
              >
                {isLoading ? 'Drawing...' : 'Confirm'}
              </Button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
