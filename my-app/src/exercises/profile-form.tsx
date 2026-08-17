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


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const ProfileSchema = z.object({
  displayName: z.string().min(2, 'At least 2 characters').max(50, 'Max 50 characters'),
  bio: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
  contact: z.object({
    email: z.string().email('Invalid email'),
    phone: z.string().regex(/^(\+\d{1,15})?$/, 'E.164 format (+123456789) or empty').optional().or(z.literal('')),
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
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
    mode: 'onBlur',
  });

  const submit = async (data: ProfileInput) => {
    try {
      await onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Failed to save profile',
      });
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Edit Profile</h2>

      {errors.root?.serverError && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: 4,
          }}
          role="alert"
        >
          {errors.root.serverError.message}
        </div>
      )}

      {saved && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#efe',
            color: '#060',
            borderRadius: 4,
          }}
        >
          Saved!
        </div>
      )}

      <form onSubmit={handleSubmit(submit)}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="displayName">
            Display Name
            <input
              id="displayName"
              type="text"
              {...register('displayName')}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: 8,
              }}
            />
          </label>
          {errors.displayName && (
            <span style={{ color: 'red', fontSize: 12 }}>
              {errors.displayName.message}
            </span>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="bio">
            Bio (optional)
            <textarea
              id="bio"
              {...register('bio')}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: 8,
                minHeight: 80,
              }}
            />
          </label>
          {errors.bio && (
            <span style={{ color: 'red', fontSize: 12 }}>
              {errors.bio.message}
            </span>
          )}
        </div>

        <fieldset style={{ marginBottom: 16, border: 'none', padding: 0 }}>
          <legend style={{ marginBottom: 12 }}>Contact</legend>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="email">
              Email
              <input
                id="email"
                type="email"
                {...register('contact.email')}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 4,
                  padding: 8,
                }}
              />
            </label>
            {errors.contact?.email && (
              <span style={{ color: 'red', fontSize: 12 }}>
                {errors.contact.email.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="phone">
              Phone (optional, E.164 format)
              <input
                id="phone"
                type="text"
                placeholder="+123456789"
                {...register('contact.phone')}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 4,
                  padding: 8,
                }}
              />
            </label>
            {errors.contact?.phone && (
              <span style={{ color: 'red', fontSize: 12 }}>
                {errors.contact.phone.message}
              </span>
            )}
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: 16, border: 'none', padding: 0 }}>
          <legend style={{ marginBottom: 12 }}>Preferences</legend>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="theme">
              Theme
              <select
                id="theme"
                {...register('preferences.theme')}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 4,
                  padding: 8,
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            {errors.preferences?.theme && (
              <span style={{ color: 'red', fontSize: 12 }}>
                {errors.preferences.theme.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              <input
                type="checkbox"
                {...register('preferences.newsletter')}
                style={{ marginRight: 8 }}
              />
              Subscribe to newsletter
            </label>
            {errors.preferences?.newsletter && (
              <span style={{ color: 'red', fontSize: 12, display: 'block' }}>
                {errors.preferences.newsletter.message}
              </span>
            )}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
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
