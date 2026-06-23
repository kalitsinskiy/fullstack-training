/**
 * Exercise: Multi-step checkout form
 *
 * A 3-step form. Each step shows a subset of fields. The user can move
 * Next / Back. State is preserved across step navigation. Submit happens
 * only on the last step's "Place order" button.
 *
 * Steps:
 *   Step 1 — Account:    fullName, email
 *   Step 2 — Shipping:   address, city, zip, country
 *   Step 3 — Payment:    cardNumber (16 digits), expiry (MM/YY), cvv (3 digits)
 *
 * Requirements:
 * 1. Define one combined Zod schema (split into 3 sub-schemas, then merged
 *    with z.object({...accountShape, ...shippingShape, ...paymentShape}))
 * 2. Use ONE useForm<...> instance for the whole flow.
 *    Validate per-step using `trigger(['field1', 'field2'])` before allowing Next.
 * 3. Track current step in component state (0, 1, 2).
 * 4. Render only the inputs for the current step (other steps' values stay
 *    in RHF's internal state — that's the point of using one form).
 * 5. "Next" disabled if current step has errors. "Back" never disabled.
 * 6. Last step "Place order" calls handleSubmit and submits the full data.
 *
 * Hints:
 * - `const { trigger } = useForm(...)` returns a promise<boolean> — true means valid
 * - `await trigger(['fullName', 'email'])` validates only those fields
 * - For card number: z.string().regex(/^\d{16}$/, 'Must be 16 digits')
 * - For expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY format')
 * - You can use `formState.errors` to enable/disable Next conditionally
 *
 * Run by importing <MultiStepCheckoutDemo /> into a Vite app.
 */

/* eslint-disable */
// @ts-nocheck — exercise stub. Remove this after implementing.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- TODO 1: Define schemas ----
//
// const AccountSchema  = z.object({ fullName: ..., email: ... });
// const ShippingSchema = z.object({ address: ..., city: ..., zip: ..., country: ... });
// const PaymentSchema  = z.object({ cardNumber: ..., expiry: ..., cvv: ... });
//

const AccountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const ShippingSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  zip: z.string().min(4, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
});

const PaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Must be 16 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY format'),
  cvv: z.string().regex(/^\d{3}$/, 'Must be 3 digits'),
});

// const CheckoutSchema = AccountSchema.merge(ShippingSchema).merge(PaymentSchema);
// type CheckoutInput = z.infer<typeof CheckoutSchema>;

const CheckoutSchema = AccountSchema.merge(ShippingSchema).merge(PaymentSchema);
type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Helper — fields per step (used for trigger())
const fieldsByStep = [
  ['fullName', 'email'], // step 0 — account
  ['address', 'city', 'zip', 'country'], // step 1 — shipping
  ['cardNumber', 'expiry', 'cvv'], // step 2 — payment
] as const;

// ---- TODO 2: Implement MultiStepCheckout ----

function MultiStepCheckout() {
  const [step, setStep] = useState(0);

  // TODO: useForm with resolver
  // TODO: handleSubmit, register, trigger, formState

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    mode: 'onTouched',
  });

  const currentStepHasErrors = fieldsByStep[step].some(
    (field) => errors[field as keyof CheckoutInput]
  );
  const goNext = async () => {
    // TODO: const ok = await trigger(fieldsByStep[step]);
    // TODO: if (ok) setStep(step + 1);
    const ok = await trigger(fieldsByStep[step] as any);
    if (ok) setStep(step + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (data: unknown) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Order placed:', data);
    alert('Order placed! Check the console.');
  };

  const field = (label: string, node: React.ReactNode, error?: string) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
        {label}
      </label>
      {node}
      {error && <span style={{ display: 'block', color: 'red', fontSize: 12, marginTop: 3 }}>{error}</span>}
    </div>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      style={{ display: 'block', width: '100%', padding: '6px 8px', boxSizing: 'border-box', fontSize: 14, border: '1px solid var(--border)', borderRadius: 4, outline: 'none' }}
      {...props}
    />
  );

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 400, textAlign: 'left' }}>
      <h2 style={{ marginBottom: 4 }}>Checkout</h2>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Step {step + 1} of 3</p>

      <form onSubmit={handleSubmit(submit)}>
        {step === 0 && (
          <section>
            <h3 style={{ marginBottom: 16 }}>Account</h3>
            {field('Full Name', input({ ...register('fullName'), placeholder: 'John Doe' }), errors.fullName?.message)}
            {field('Email', input({ ...register('email'), type: 'email', placeholder: 'john@example.com' }), errors.email?.message)}
          </section>
        )}

        {step === 1 && (
          <section>
            <h3 style={{ marginBottom: 16 }}>Shipping</h3>
            {field('Address', input({ ...register('address'), placeholder: '123 Main St' }), errors.address?.message)}
            {field('City', input({ ...register('city'), placeholder: 'New York' }), errors.city?.message)}
            {field('ZIP', input({ ...register('zip'), placeholder: '10001' }), errors.zip?.message)}
            {field('Country', input({ ...register('country'), placeholder: 'USA' }), errors.country?.message)}
          </section>
        )}

        {step === 2 && (
          <section>
            <h3 style={{ marginBottom: 16 }}>Payment</h3>
            {field('Card Number', input({ ...register('cardNumber'), placeholder: '1234567890123456', maxLength: 16 }), errors.cardNumber?.message)}
            {field('Expiry', input({ ...register('expiry'), placeholder: 'MM/YY' }), errors.expiry?.message)}
            {field('CVV', input({ ...register('cvv'), placeholder: '123', maxLength: 3 }), errors.cvv?.message)}
          </section>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button type="button" onClick={goBack} disabled={step === 0}>Back</button>
          {step < 2 ? (
            <button type="button" onClick={goNext} disabled={currentStepHasErrors}>Next</button>
          ) : (
            <button type="submit">Place order</button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function MultiStepCheckoutDemo() {
  return <MultiStepCheckout />;
}
