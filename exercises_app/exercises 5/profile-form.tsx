/**
 * Exercise: Profile Form (nested objects)
 *
 * Build a profile editor with the following shape:
 *
 *   {
 *     displayName: string         (2-50 chars)
 *     bio: string                 (max 500 chars, optional)
 *     contact: {
 *       email: string             (valid email)
 *       phone: string             (E.164: +123456789, optional)
 *     }
 *     preferences: {
 *       newsletter: boolean
 *       theme: 'light' | 'dark' | 'system'
 *     }
 *   }
 *
 * Requirements:
 * 1. Define the Zod schema with nested objects (z.object inside z.object)
 * 2. Use useForm<...> with zodResolver
 * 3. defaultValues = the existing profile passed as prop
 * 4. Render labels + inputs for every field
 *    - bio is a textarea
 *    - theme is a <select> with three options
 *    - newsletter is a checkbox (use {...register('preferences.newsletter')})
 * 5. Disable Save while isSubmitting; show "Saved!" briefly after success
 * 6. On submit failure, surface the message via setError('root.serverError', …)
 *
 * Hints:
 * - For nested register, use dot notation: register('contact.email')
 * - For checkbox: errors.preferences?.newsletter, value is boolean
 * - For select: register('preferences.theme'), options match the literal type
 * - z.literal / z.enum for theme: z.enum(['light','dark','system'])
 *
 * Run by importing <ProfileFormDemo /> into a Vite app.
 */

/* eslint-disable */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, type CSSProperties } from 'react';

// ---- TODO 1: Define the schema ----
//
// const ProfileSchema = z.object({
//   displayName: ...,
//   bio: ...,
//   contact: z.object({
//     email: ...,
//     phone: ... .optional(),
//   }),
//   preferences: z.object({
//     newsletter: z.boolean(),
//     theme: z.enum([...]),
//   }),
// });
// type ProfileInput = z.infer<typeof ProfileSchema>;

const ProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  contact: z.object({
    email: z.string().email(),
    phone: z
      .string()
      .regex(/^\+[0-9]+$/, 'must be E.164: +123456789')
      .optional()
      .or(z.literal('')),
  }),
  preferences: z.object({
    newsletter: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
  }),
});

type ProfileInput = z.infer<typeof ProfileSchema>;

// ---- TODO 2: Implement ProfileForm ----

interface ProfileFormProps {
  initial: ProfileInput;
  onSave: (data: ProfileInput) => Promise<void>;
}

function ProfileForm({ initial, onSave }: ProfileFormProps) {
  // TODO: useForm with resolver + defaultValues = initial
  // TODO: handleSubmit, errors, isSubmitting from formState
  // TODO: a "saved" boolean state for the success indicator
  // TODO: render the form

  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
  });

  const onSubmit = async (data: ProfileInput) => {
    try {
      await onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError('root.serverError', { message: err.message ?? 'Server error' });
    }
  };

  const inputStyle: CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #555',
    background: '#1e1e1e',
    color: '#fff',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
  };

  const buttonStyle: CSSProperties = {
    padding: '8px 20px',
    borderRadius: 6,
    border: 'none',
    background: '#6d28d9',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  };

  const errorStyle: CSSProperties = {
    color: '#f87171',
    fontSize: 12,
    margin: 0,
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h2>Edit Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* displayName */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Display Name</label>
          <input {...register('displayName')} style={inputStyle} />
          {errors.displayName && <p style={errorStyle}>{errors.displayName.message}</p>}
        </div>

        {/* bio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Bio</label>
          <textarea {...register('bio')} rows={4} style={inputStyle} />
          {errors.bio && <p style={errorStyle}>{errors.bio.message}</p>}
        </div>

        {/* contact.email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Email</label>
          <input {...register('contact.email')} type="email" style={inputStyle} />
          {errors.contact?.email && <p style={errorStyle}>{errors.contact.email.message}</p>}
        </div>

        {/* contact.phone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Phone (optional)</label>
          <input {...register('contact.phone')} placeholder="+380..." style={inputStyle} />
          {errors.contact?.phone && <p style={errorStyle}>{errors.contact.phone.message}</p>}
        </div>

        {/* preferences.theme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Theme</label>
          <select {...register('preferences.theme')} style={inputStyle}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* preferences.newsletter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" {...register('preferences.newsletter')} />
          <label>Subscribe to newsletter</label>
          {errors.preferences?.newsletter && (
            <p style={errorStyle}>{errors.preferences.newsletter.message}</p>
          )}
        </div>

        {/* server error */}
        {errors.root?.serverError && (
          <p style={errorStyle}>{errors.root.serverError.message}</p>
        )}

        {/* submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          {saved && <span style={{ color: '#4ade80' }}>Saved!</span>}
        </div>
      </form>
    </div>
  );
}

// ---- Demo wiring ----

const sampleProfile = {
  displayName: 'Alice',
  bio: 'Frontend dev, coffee enthusiast',
  contact: { email: 'alice@example.com', phone: '' },
  preferences: { newsletter: true, theme: 'system' as const },
};

async function fakeSave(data: unknown) {
  await new Promise((r) => setTimeout(r, 400));
  if (Math.random() < 0.2) throw new Error('Server is unavailable');
  console.log('Saved profile:', data);
}

export default function ProfileFormDemo() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <ProfileForm initial={sampleProfile} onSave={fakeSave} />
    </div>
  );
}
