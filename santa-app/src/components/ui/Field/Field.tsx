import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FieldProps extends React.ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, name, className, ...rest }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} aria-invalid={!!error} className={className} {...rest} />
      {error && <p className="text-[0.78rem] text-red-500">{error}</p>}
    </div>
  );
}
