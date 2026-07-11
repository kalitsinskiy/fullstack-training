import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { useDraw } from './hooks';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DrawDialog({ roomId, open, onOpenChange }: Props) {
  const [date, setDate] = useState<Date | undefined>();
  const draw = useDraw(roomId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function confirm() {
    if (!date) return;

    try {
      await draw.mutateAsync(format(date, 'yyyy-MM-dd'));
      toast.success('Names drawn!');
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not run the draw'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Draw names</DialogTitle>
          <DialogDescription>
            Pick the gift-exchange date. Everyone learns their giftee the moment
            you draw.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: today }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {date
            ? `Exchange on ${format(date, 'EEE, d MMM yyyy')}`
            : 'Select date to continue'}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!date || draw.isPending}>
            {draw.isPending ? 'Drawing…' : 'Draw names'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
