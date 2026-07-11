import 'react-day-picker/style.css';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

export function Calendar({ className, ...rest }: DayPickerProps) {
  return (
    <DayPicker
      className={cn('santa-calendar', className)}
      weekStartsOn={1}
      {...rest}
    />
  );
}
