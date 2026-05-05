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

  return (
    <div style={{ padding: 24 }}>
      TODO: implement the form. See the comments at the top of this file.
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
