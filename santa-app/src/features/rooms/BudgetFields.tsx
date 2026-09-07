import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import { SelectField } from '@/components/ui/select-field';
import { CURRENCIES, type Currency } from '@/schemas/rooms';

export type BudgetFormValues = { budget?: number; currency?: Currency };

interface Props<T extends FieldValues & BudgetFormValues> {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  budgetPlaceholder?: string;
}

export function BudgetFields<T extends FieldValues & BudgetFormValues>({
  register,
  control,
  errors,
  budgetPlaceholder,
}: Props<T>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        label="Budget (optional)"
        type="number"
        min={1}
        placeholder={budgetPlaceholder}
        {...register('budget' as Path<T>)}
        error={errors.budget?.message as string | undefined}
      />
      <SelectField
        control={control}
        name={'currency' as Path<T>}
        label="Currency"
        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        error={errors.currency?.message as string | undefined}
      />
    </div>
  );
}
