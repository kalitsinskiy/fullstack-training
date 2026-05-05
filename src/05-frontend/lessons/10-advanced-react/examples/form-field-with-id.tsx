/**
 * Reusable accessible <FormField> using useId
 *
 * Pattern: every form field auto-generates a stable id and an associated
 * error id, so labels and aria-describedby always line up.
 *
 * IMPORTANT: this implementation uses `forwardRef` so it works with React
 * Hook Form (which is what santa-app uses after L08). RHF's `register('name')`
 * returns a `ref` that must reach the underlying <input> — without
 * forwardRef the ref attaches to the <div> wrapper and RHF reads nothing.
 *
 * For non-RHF use (controlled / useState), the same component still works:
 * pass `value` + `onChange` like a normal <input>; the ref slot is unused.
 *
 * Pairs with Lesson 08 (Forms) — replaces the boilerplate of manually
 * declaring htmlFor / id / aria-* per field.
 */

import { forwardRef, useId } from 'react';

// ---- The reusable component ----

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>;

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, ...inputProps }, ref) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    // aria-describedby gets all relevant secondary IDs in space-separated form.
    // Both hint and error spans are rendered conditionally, so we never point
    // aria-describedby at a missing or empty element.
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div style={{ display: 'grid', gap: 4 }}>
        <label htmlFor={id} style={{ fontWeight: 500 }}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          style={{
            padding: 8,
            border: `1px solid ${error ? '#b91c1c' : '#cbd5e1'}`,
            borderRadius: 4,
            ...inputProps.style,
          }}
          {...inputProps}
        />
        {hint && !error && (
          <span id={hintId} style={{ color: '#64748b', fontSize: 12 }}>
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>
            {error}
          </span>
        )}
      </div>
    );
  },
);

// ---- Usage with React Hook Form ----
//
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
//
// const { register, formState: { errors } } = useForm<LoginInput>({
//   resolver: zodResolver(LoginSchema),
// });
//
// <FormField
//   label="Email"
//   type="email"
//   error={errors.email?.message}
//   {...register('email')}      // spread LAST — ref/onChange/onBlur from RHF win
// />

// ---- Demo ----

import { useState } from 'react';

export default function FormFieldDemo() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const error = submitted && !email.includes('@') ? 'Enter a valid email' : undefined;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      style={{ padding: 24, display: 'grid', gap: 12, maxWidth: 400, fontFamily: 'system-ui, sans-serif' }}
    >
      <h2>Reusable accessible field</h2>

      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        hint="We'll never share your address."
        error={error}
        required
      />

      {/* Render twice — each gets a unique useId */}
      <FormField
        label="Confirm email"
        type="email"
        defaultValue=""
        hint="Just to be sure."
      />

      <button type="submit">Submit</button>
    </form>
  );
}
