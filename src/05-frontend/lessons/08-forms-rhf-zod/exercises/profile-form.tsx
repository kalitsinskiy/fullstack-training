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
// @ts-nocheck — exercise stub. Remove this directive after implementing.

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

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
  displayName: z.string().min(2, 'At least 2 characters').max(50, 'At most 50 characters'),
  bio: z.string().max(500, 'At most 500 characters').optional(),
  contact: z.object({
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^\+\d{6,15}$/, 'E.164 format, e.g. +123456789')
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
  initial: any; // TODO: type as ProfileInput once schema is defined
  onSave: (data: any) => Promise<void>;
}

function ProfileForm({ initial, onSave }: ProfileFormProps) {
  // TODO: useForm with resolver + defaultValues = initial
  // TODO: handleSubmit, errors, isSubmitting from formState
  // TODO: a "saved" boolean state for the success indicator
  // TODO: render the form
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
  });

  const [saved, setSaved] = useState(false);

  const submit = async (data: ProfileInput) => {
    setSaved(false);
    try {
      await onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  };

  const fieldStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 8, marginTop: 4 };
  const errorStyle: React.CSSProperties = { color: '#b91c1c', fontSize: 13 };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      style={{ display: 'grid', gap: 12, maxWidth: 420, padding: 24, fontFamily: 'system-ui, sans-serif' }}
    >
      <h2>Edit profile</h2>

      <div>
        <label htmlFor="displayName">Display name</label>
        <input id="displayName" style={fieldStyle} {...register('displayName')} />
        {errors.displayName && <span role="alert" style={errorStyle}>{errors.displayName.message}</span>}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" rows={4} style={fieldStyle} {...register('bio')} />
        {errors.bio && <span role="alert" style={errorStyle}>{errors.bio.message}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" style={fieldStyle} {...register('contact.email')} />
        {errors.contact?.email && <span role="alert" style={errorStyle}>{errors.contact.email.message}</span>}
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <input id="phone" style={fieldStyle} {...register('contact.phone')} />
        {errors.contact?.phone && <span role="alert" style={errorStyle}>{errors.contact.phone.message}</span>}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" {...register('preferences.newsletter')} />
        Subscribe to newsletter
      </label>

      <div>
        <label htmlFor="theme">Theme</label>
        <select id="theme" style={fieldStyle} {...register('preferences.theme')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        {errors.preferences?.theme && <span role="alert" style={errorStyle}>{errors.preferences.theme.message}</span>}
      </div>

      {errors.root?.serverError && (
        <span role="alert" style={errorStyle}>{errors.root.serverError.message}</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
        {saved && <span style={{ color: '#15803d', fontSize: 14 }}>Saved!</span>}
      </div>
    </form>
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
