import { useId } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';

interface DateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minDate?: Date;
  placeholder?: string;
  error?: string;
}

export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  minDate,
  placeholder = 'No date selected',
  error,
}: DateFieldProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div
      className="space-y-2"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : hintId}
    >
      <Label id={labelId}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value as Date | undefined;

          return (
            <div className="space-y-1">
              <div className="flex justify-center rounded-md border">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={field.onChange}
                  disabled={minDate ? { before: minDate } : undefined}
                />
              </div>
              <p
                id={hintId}
                className="text-center text-sm text-muted-foreground"
              >
                {value ? format(value, 'EEE, d MMM yyyy') : placeholder}
              </p>
            </div>
          );
        }}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
