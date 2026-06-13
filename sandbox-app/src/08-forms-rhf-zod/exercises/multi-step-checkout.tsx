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
  ['fullName', 'email'], // step 0 — account
  ['address', 'city', 'zip', 'country'], // step 1 — shipping
  ['cardNumber', 'expiry', 'cvv'], // step 2 — payment
] as const;

const AccountSchema = z.object({
  fullName: z.string().min(2, 'At least 2 chars'),
  email: z.email('Enter a valid email'),
});

const ShippingSchema = z.object({
  address: z.string().min(2, 'Required'),
  city: z.string().min(2, 'Required'),
  zip: z.string().regex(/^\d{4,10}$/, 'Enter a valid ZIP (4-10 digits)'),
  country: z.string().min(2, 'Required'),
});

const PaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Must be 16 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY format'),
  cvv: z.string().regex(/^\d{3}$/, 'Must be 3 digits'),
});

const CheckoutSchema = AccountSchema.merge(ShippingSchema).merge(PaymentSchema);
type CheckoutInput = z.infer<typeof CheckoutSchema>;

// ---- TODO 2: Implement MultiStepCheckout ----

function MultiStepCheckout() {
  const [step, setStep] = useState(0);

  // TODO: useForm with resolver
  // TODO: handleSubmit, register, trigger, formState
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      address: '',
      city: '',
      zip: '',
      country: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
  });

  const goNext = async () => {
    // TODO: const ok = await trigger(fieldsByStep[step]);
    // TODO: if (ok) setStep(step + 1);
    const ok = await trigger(fieldsByStep[step]);
    if (ok) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const hasStepErrors = fieldsByStep[step].some((field) => errors[field]);

  const submit = async (data: unknown) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Order placed:', data);
    alert('Order placed! Check the console.');
  };

  const fieldStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: 8,
    marginTop: 4,
  };
  const errorStyle: React.CSSProperties = { color: '#b91c1c', fontSize: 13 };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 480,
        marginInline: 'auto',
      }}
    >
      <h2>Checkout — step {step + 1} of 3</h2>

      <form
        // TODO: onSubmit={handleSubmit(submit)}
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        {step === 0 && (
          <section style={{ display: 'grid', gap: 12 }}>
            {/* TODO: render Account fields with register(...) and error displays */}
            <div>
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" style={fieldStyle} {...register('fullName')} />
              {errors.fullName && (
                <span role="alert" style={errorStyle}>
                  {errors.fullName.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                style={fieldStyle}
                {...register('email')}
              />
              {errors.email && (
                <span role="alert" style={errorStyle}>
                  {errors.email.message}
                </span>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section style={{ display: 'grid', gap: 12 }}>
            {/* TODO: render Shipping fields */}
            <div>
              <label htmlFor="address">Address</label>
              <input id="address" style={fieldStyle} {...register('address')} />
              {errors.address && (
                <span role="alert" style={errorStyle}>
                  {errors.address.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="city">City</label>
              <input id="city" style={fieldStyle} {...register('city')} />
              {errors.city && (
                <span role="alert" style={errorStyle}>
                  {errors.city.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="zip">ZIP</label>
              <input id="zip" inputMode="numeric" style={fieldStyle} {...register('zip')} />
              {errors.zip && (
                <span role="alert" style={errorStyle}>
                  {errors.zip.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="country">Country</label>
              <input id="country" style={fieldStyle} {...register('country')} />
              {errors.country && (
                <span role="alert" style={errorStyle}>
                  {errors.country.message}
                </span>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            {/* TODO: render Payment fields */}
            <div>
              <label htmlFor="cardNumber">Card number</label>
              <input
                id="cardNumber"
                inputMode="numeric"
                placeholder="1234567812345678"
                style={fieldStyle}
                {...register('cardNumber')}
              />
              {errors.cardNumber && (
                <span role="alert" style={errorStyle}>
                  {errors.cardNumber.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="expiry">Expiry (MM/YY)</label>
              <input id="expiry" placeholder="08/27" style={fieldStyle} {...register('expiry')} />
              {errors.expiry && (
                <span role="alert" style={errorStyle}>
                  {errors.expiry.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                inputMode="numeric"
                placeholder="123"
                style={fieldStyle}
                {...register('cvv')}
              />
              {errors.cvv && (
                <span role="alert" style={errorStyle}>
                  {errors.cvv.message}
                </span>
              )}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={goBack} disabled={step === 0}>
            Back
          </button>
          {step < 2 ? (
            <button type="button" onClick={goNext} disabled={hasStepErrors}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              Place order
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function MultiStepCheckoutDemo() {
  return <MultiStepCheckout />;
}
