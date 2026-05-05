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
// const CheckoutSchema = AccountSchema.merge(ShippingSchema).merge(PaymentSchema);
// type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Helper — fields per step (used for trigger())
const fieldsByStep = [
  ['fullName', 'email'],                              // step 0 — account
  ['address', 'city', 'zip', 'country'],              // step 1 — shipping
  ['cardNumber', 'expiry', 'cvv'],                    // step 2 — payment
] as const;

// ---- TODO 2: Implement MultiStepCheckout ----

function MultiStepCheckout() {
  const [step, setStep] = useState(0);

  // TODO: useForm with resolver
  // TODO: handleSubmit, register, trigger, formState

  const goNext = async () => {
    // TODO: const ok = await trigger(fieldsByStep[step]);
    // TODO: if (ok) setStep(step + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (data: unknown) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Order placed:', data);
    alert('Order placed! Check the console.');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Checkout — step {step + 1} of 3</h2>

      <form
      // TODO: onSubmit={handleSubmit(submit)}
      >
        {step === 0 && (
          <section>
            {/* TODO: render Account fields with register(...) and error displays */}
            <p>TODO: Account fields (fullName, email)</p>
          </section>
        )}

        {step === 1 && (
          <section>
            {/* TODO: render Shipping fields */}
            <p>TODO: Shipping fields (address, city, zip, country)</p>
          </section>
        )}

        {step === 2 && (
          <section>
            {/* TODO: render Payment fields */}
            <p>TODO: Payment fields (cardNumber, expiry, cvv)</p>
          </section>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={goBack} disabled={step === 0}>Back</button>
          {step < 2 ? (
            <button type="button" onClick={goNext}>Next</button>
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
