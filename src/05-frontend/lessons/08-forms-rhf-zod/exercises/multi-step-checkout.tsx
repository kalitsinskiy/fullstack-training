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
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---- Schemas ----

const AccountSchema = z.object({
  fullName: z.string().min(2, 'At least 2 characters'),
  email: z.email('Enter a valid email'),
});

const ShippingSchema = z.object({
  address: z.string().min(3, 'Required'),
  city: z.string().min(1, 'Required'),
  zip: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
});

const PaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Must be 16 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY format'),
  cvv: z.string().regex(/^\d{3}$/, 'Must be 3 digits'),
});

const CheckoutSchema = AccountSchema.merge(ShippingSchema).merge(PaymentSchema);
type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Helper — fields per step (used for trigger())
const fieldsByStep = [
  ['fullName', 'email'] as const,
  ['address', 'city', 'zip', 'country'] as const,
  ['cardNumber', 'expiry', 'cvv'] as const,
];

// ---- Component ----

function MultiStepCheckout() {
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    mode: 'onTouched',
  });

  const goNext = async () => {
    const ok = await trigger(fieldsByStep[step] as (keyof CheckoutInput)[]);
    if (ok) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (data: CheckoutInput) => {
    await new Promise((r) => setTimeout(r, 400));
    console.log('Order placed:', data);
    alert('Order placed! Check the console.');
  };

  const fieldStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '6px 8px',
    marginTop: 4,
    border: '1px solid #ccc',
    borderRadius: 4,
  };
  const errorStyle: React.CSSProperties = { color: '#b91c1c', fontSize: 13, marginTop: 2 };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Checkout — step {step + 1} of 3</h2>

      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['Account', 'Shipping', 'Payment'].map((label, i) => (
          <span
            key={label}
            style={{
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              background: i === step ? '#1d4ed8' : i < step ? '#bbf7d0' : '#e5e7eb',
              color: i === step ? '#fff' : '#374151',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit(submit)} noValidate style={{ display: 'grid', gap: 12 }}>
        {/* Step 0 — Account */}
        {step === 0 && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h3>Account details</h3>

            <div>
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                style={fieldStyle}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                {...register('fullName')}
              />
              {errors.fullName && (
                <span id="fullName-error" role="alert" style={errorStyle}>
                  {errors.fullName.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                style={fieldStyle}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <span id="email-error" role="alert" style={errorStyle}>
                  {errors.email.message}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Step 1 — Shipping */}
        {step === 1 && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h3>Shipping address</h3>

            <div>
              <label htmlFor="address">Street address</label>
              <input
                id="address"
                style={fieldStyle}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'address-error' : undefined}
                {...register('address')}
              />
              {errors.address && (
                <span id="address-error" role="alert" style={errorStyle}>
                  {errors.address.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="city">City</label>
              <input
                id="city"
                style={fieldStyle}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? 'city-error' : undefined}
                {...register('city')}
              />
              {errors.city && (
                <span id="city-error" role="alert" style={errorStyle}>
                  {errors.city.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="zip">ZIP / Postal code</label>
              <input
                id="zip"
                style={fieldStyle}
                aria-invalid={!!errors.zip}
                aria-describedby={errors.zip ? 'zip-error' : undefined}
                {...register('zip')}
              />
              {errors.zip && (
                <span id="zip-error" role="alert" style={errorStyle}>
                  {errors.zip.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="country">Country</label>
              <input
                id="country"
                style={fieldStyle}
                aria-invalid={!!errors.country}
                aria-describedby={errors.country ? 'country-error' : undefined}
                {...register('country')}
              />
              {errors.country && (
                <span id="country-error" role="alert" style={errorStyle}>
                  {errors.country.message}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h3>Payment</h3>

            <div>
              <label htmlFor="cardNumber">Card number (16 digits)</label>
              <input
                id="cardNumber"
                inputMode="numeric"
                maxLength={16}
                placeholder="1234567812345678"
                style={fieldStyle}
                aria-invalid={!!errors.cardNumber}
                aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                {...register('cardNumber')}
              />
              {errors.cardNumber && (
                <span id="cardNumber-error" role="alert" style={errorStyle}>
                  {errors.cardNumber.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="expiry">Expiry (MM/YY)</label>
              <input
                id="expiry"
                placeholder="06/27"
                maxLength={5}
                style={fieldStyle}
                aria-invalid={!!errors.expiry}
                aria-describedby={errors.expiry ? 'expiry-error' : undefined}
                {...register('expiry')}
              />
              {errors.expiry && (
                <span id="expiry-error" role="alert" style={errorStyle}>
                  {errors.expiry.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="cvv">CVV (3 digits)</label>
              <input
                id="cvv"
                inputMode="numeric"
                maxLength={3}
                placeholder="123"
                style={{ ...fieldStyle, maxWidth: 80 }}
                aria-invalid={!!errors.cvv}
                aria-describedby={errors.cvv ? 'cvv-error' : undefined}
                {...register('cvv')}
              />
              {errors.cvv && (
                <span id="cvv-error" role="alert" style={errorStyle}>
                  {errors.cvv.message}
                </span>
              )}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={goBack} disabled={step === 0}>
            Back
          </button>
          {step < 2 ? (
            <button type="button" onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Placing order...' : 'Place order'}
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
