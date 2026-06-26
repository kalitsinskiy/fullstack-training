import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  /** Disable days before this (defaults to today — no past exchange dates). */
  fromDate?: Date;
  className?: string;
}

// Inline month calendar (react-day-picker), themed to the Santa primary. Rendered
// directly inside a Dialog — NOT inside a Popover (a popover dismisses on the
// day/nav clicks, which made selection and month navigation impossible).
export function Calendar({
  selected,
  onSelect,
  fromDate = new Date(new Date().setHours(0, 0, 0, 0)),
  className,
}: CalendarProps) {
  // Theme overrides live in index.css under `.santa-cal` (higher specificity than
  // react-day-picker's own `.rdp-root` defaults, which are blue).
  return (
    <div className={cn('santa-cal flex justify-center', className)}>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={{ before: fromDate }}
        weekStartsOn={1}
        showOutsideDays
      />
    </div>
  );
}
