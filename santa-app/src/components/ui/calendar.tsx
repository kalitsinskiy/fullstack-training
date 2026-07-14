import { DayPicker, type DayPickerProps } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '@/lib/utils';

export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <div className={cn('santa-cal', className)}>
      <DayPicker
        weekStartsOn={1} // Monday
        showOutsideDays
        {...props}
      />
    </div>
  );
}
