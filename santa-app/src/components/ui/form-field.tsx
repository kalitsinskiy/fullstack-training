import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';

type ControlProps =
  | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>);

type FormFieldProps = { label: string; error?: string } & ControlProps;

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(({ label, error, id, name, className, multiline, ...rest }, ref) => {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const errorId = `${fieldId}-error`;
  const shared = {
    id: fieldId,
    name,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
    className,
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      {multiline ? (
        <Textarea
          ref={ref as Ref<HTMLTextAreaElement>}
          {...shared}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <Input
          ref={ref as Ref<HTMLInputElement>}
          {...shared}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});
FormField.displayName = 'FormField';
