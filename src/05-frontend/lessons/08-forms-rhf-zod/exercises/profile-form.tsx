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
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// ---- Schema ----

const ProfileSchema = z.object({
  displayName: z.string().min(2, 'At least 2 characters').max(50, 'Max 50 characters'),
  bio: z.string().max(500, 'Max 500 characters').optional(),
  contact: z.object({
    email: z.email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^\+\d{7,15}$/, 'Use E.164 format: +123456789')
      .optional()
      .or(z.literal('')),
  }),
  preferences: z.object({
    newsletter: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
  }),
});

type ProfileInput = z.infer<typeof ProfileSchema>;

// ---- Component ----

interface ProfileFormProps {
  initial: ProfileInput;
  onSave: (data: ProfileInput) => Promise<void>;
}

function ProfileForm({ initial, onSave }: ProfileFormProps) {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
  });

  const submit = async (data: ProfileInput) => {
    try {
      await onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Save failed',
      });
    }
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
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      style={{ display: 'grid', gap: 16, maxWidth: 480, padding: 24 }}
    >
      <h2>Edit profile</h2>

      {errors.root?.serverError && (
        <div
          role="alert"
          style={{ background: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 4 }}
        >
          {errors.root.serverError.message}
        </div>
      )}

      {/* displayName */}
      <div>
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          style={fieldStyle}
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          {...register('displayName')}
        />
        {errors.displayName && (
          <span id="displayName-error" role="alert" style={errorStyle}>
            {errors.displayName.message}
          </span>
        )}
      </div>

      {/* bio */}
      <div>
        <label htmlFor="bio">Bio (optional)</label>
        <textarea
          id="bio"
          rows={3}
          style={fieldStyle}
          aria-invalid={!!errors.bio}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
          {...register('bio')}
        />
        {errors.bio && (
          <span id="bio-error" role="alert" style={errorStyle}>
            {errors.bio.message}
          </span>
        )}
      </div>

      {/* contact.email */}
      <div>
        <label htmlFor="contact-email">Contact email</label>
        <input
          id="contact-email"
          type="email"
          style={fieldStyle}
          aria-invalid={!!errors.contact?.email}
          aria-describedby={errors.contact?.email ? 'contact-email-error' : undefined}
          {...register('contact.email')}
        />
        {errors.contact?.email && (
          <span id="contact-email-error" role="alert" style={errorStyle}>
            {errors.contact.email.message}
          </span>
        )}
      </div>

      {/* contact.phone */}
      <div>
        <label htmlFor="contact-phone">Phone (optional, E.164)</label>
        <input
          id="contact-phone"
          type="tel"
          placeholder="+123456789"
          style={fieldStyle}
          aria-invalid={!!errors.contact?.phone}
          aria-describedby={errors.contact?.phone ? 'contact-phone-error' : undefined}
          {...register('contact.phone')}
        />
        {errors.contact?.phone && (
          <span id="contact-phone-error" role="alert" style={errorStyle}>
            {errors.contact.phone.message}
          </span>
        )}
      </div>

      {/* preferences.newsletter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input id="newsletter" type="checkbox" {...register('preferences.newsletter')} />
        <label htmlFor="newsletter">Subscribe to newsletter</label>
      </div>

      {/* preferences.theme */}
      <div>
        <label htmlFor="theme">Theme</label>
        <select id="theme" style={fieldStyle} {...register('preferences.theme')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        {errors.preferences?.theme && (
          <span role="alert" style={errorStyle}>
            {errors.preferences.theme.message}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {saved && <span style={{ color: '#166534', fontSize: 14 }}>Saved!</span>}
      </div>
    </form>
  );
}

// ---- Demo wiring ----

const sampleProfile: ProfileInput = {
  displayName: 'Alice',
  bio: 'Frontend dev, coffee enthusiast',
  contact: { email: 'alice@example.com', phone: '' },
  preferences: { newsletter: true, theme: 'system' },
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
