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

// ---- Schemas ----

const AccountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
});

const ShippingSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  zip: z.string().regex(/^\d{5}$/, 'Zip must be 5 digits'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

const PaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be MM/YY format'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV must be 3 digits'),
});

const CheckoutSchema = z.object({
  ...AccountSchema.shape,
  ...ShippingSchema.shape,
  ...PaymentSchema.shape,
});

type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Helper — fields per step (used for trigger())
const fieldsByStep = [
  ['fullName', 'email'],                              // step 0 — account
  ['address', 'city', 'zip', 'country'],              // step 1 — shipping
  ['cardNumber', 'expiry', 'cvv'],                    // step 2 — payment
] as const;

// ---- TODO 2: Implement MultiStepCheckout ----

function MultiStepCheckout() {
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    mode: 'onBlur',
  });

  const goNext = async () => {
    const ok = await trigger(fieldsByStep[step]);
    if (ok) setStep(step + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (data: CheckoutInput) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Order placed:', data);
    alert('Order placed! Check the console.');
  };

  const currentStepHasErrors = fieldsByStep[step].some(
    (field) => field in errors
  );

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Checkout — step {step + 1} of 3</h2>

      <form onSubmit={handleSubmit(submit)}>
        {step === 0 && (
          <section>
            <div style={{ marginBottom: 12 }}>
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('fullName')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.fullName && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.fullName.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.email && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.email.message}
                </span>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <div style={{ marginBottom: 12 }}>
              <label>
                Address
                <input
                  type="text"
                  placeholder="123 Main St"
                  {...register('address')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.address && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.address.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                City
                <input
                  type="text"
                  placeholder="New York"
                  {...register('city')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.city && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.city.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Zip
                <input
                  type="text"
                  placeholder="12345"
                  {...register('zip')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.zip && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.zip.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Country
                <input
                  type="text"
                  placeholder="USA"
                  {...register('country')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.country && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.country.message}
                </span>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <div style={{ marginBottom: 12 }}>
              <label>
                Card Number
                <input
                  type="text"
                  placeholder="1234567890123456"
                  {...register('cardNumber')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.cardNumber && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.cardNumber.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Expiry (MM/YY)
                <input
                  type="text"
                  placeholder="12/25"
                  {...register('expiry')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.expiry && (
                <span style={{ color: 'red', fontSize: 12 }}>
                  {errors.expiry.message}
                </span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                CVV
                <input
                  type="text"
                  placeholder="123"
                  {...register('cvv')}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {errors.cvv && (
                <span style={{ color: 'red', fontSize: 12 }}>
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
            <button type="button" onClick={goNext} disabled={currentStepHasErrors}>
              Next
            </button>
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
