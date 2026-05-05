# Forms with React Hook Form + Zod

## Quick Overview

Forms are 60% of frontend work. The naive approach — `useState` per input + manual validation in a `handleSubmit` — is fine for a single email field but collapses fast: nested objects, dynamic field arrays, async validation, controlled vs uncontrolled, accessibility errors. **React Hook Form (RHF)** handles the form mechanics; **Zod** describes the *shape* of valid data and validates against it. Together they cover every form you'll write.

## Quick Recommendation

| Form scenario | Use |
|---|---|
| Single field, throwaway | Plain `useState` is fine |
| Anything with > 2 fields, validation, async, errors | **RHF + Zod** |
| Server-driven forms with no JS | React 19 form actions (`useActionState`, `useFormStatus`) — covered briefly at the end |

## The manual baseline (Lesson 04 recap)

This is the manual approach you wrote in Lesson 04. It works, but watch what it costs:

```tsx
function LoginForm({ onSubmit }: { onSubmit: (d: { email: string; password: string }) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes('@')) errs.email = 'Invalid email';
    if (password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {serverError && <div role="alert">{serverError}</div>}

      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {errors.email && <span>{errors.email}</span>}

      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
```

Now imagine adding: a confirm-password field, a "username already taken" async check, a list of dynamic items, file upload, multi-step flow. Each `useState` and each branch in `handleSubmit` multiplies. RHF + Zod replaces all of that.

## Key Concepts

### Zod — describe the shape, validate the data

Zod is a **schema library**: you describe what valid data looks like, Zod produces both a runtime validator *and* a TypeScript type.

```bash
npm install zod
```

```ts
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

// Runtime check
const result = LoginSchema.safeParse({ email: 'bad', password: '123' });
// result.success === false
// result.error.issues === [{ path: ['email'], message: 'Invalid email' }, …]

// Type inferred from the schema — no manual interface
type LoginInput = z.infer<typeof LoginSchema>;
//   ^? { email: string; password: string }
```

The same schema can be used:
- in the form (validate before submitting)
- in API requests (parse server responses)
- in tests (generate valid sample input)
- on the backend if it's a Node project (lesson 06 of the backend section uses AJV — Zod is the equivalent for TS-first projects)

### React Hook Form — the form mechanics

```bash
npm install react-hook-form @hookform/resolvers
```

The minimal form:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type LoginInput = z.infer<typeof LoginSchema>;

function LoginForm({ onSubmit }: { onSubmit: (d: LoginInput) => Promise<void> }) {
  const {
    register,                       // hooks an input into the form
    handleSubmit,                   // wraps your submit handler with validation
    formState: { errors, isSubmitting },
    setError,                        // for server-side errors
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',                  // validate on blur (other options: onChange, onSubmit)
  });

  const submit = async (data: LoginInput) => {
    try {
      await onSubmit(data);
    } catch (err) {
      // Map server errors back into form errors
      setError('root.serverError', { message: (err as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      {errors.root?.serverError && <div role="alert">{errors.root.serverError.message}</div>}

      <label htmlFor="email">Email</label>
      <input id="email" type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <label htmlFor="password">Password</label>
      <input id="password" type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
```

What happened:
- No `useState` for fields, errors, or submitting — RHF tracks all of that internally.
- `register('email')` returns the props (`name`, `onChange`, `onBlur`, `ref`) that wire the input into the form. Spread them onto the `<input>`.
- `handleSubmit(submit)` validates against the Zod schema, blocks submission on errors, and calls `submit` only with valid typed data.
- `errors.email?.message` is the per-field error text — Zod produces them.
- `isSubmitting` is `true` while `submit` is in flight (RHF awaits the promise).
- `setError('root.serverError', …)` is the standard pattern for non-field errors (e.g. "invalid credentials").
- `noValidate` on `<form>` disables the browser's built-in validation so RHF/Zod is the single source of truth.

### Why RHF is *fast*

RHF uses **uncontrolled inputs** (refs) under the hood — typing in a field doesn't re-render the entire form. Compare to a manual `useState`-per-input form, which re-renders the whole tree on every keystroke. For a 30-field form this is the difference between buttery-smooth and laggy.

If you specifically want a controlled input (e.g. third-party `<DatePicker>` that only accepts `value`/`onChange`), use `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';   // or your component library's date input

<Controller
  control={control}
  name="dueDate"
  render={({ field, fieldState }) => (
    <DatePicker
      value={field.value}
      onChange={field.onChange}
      slotProps={{ textField: { error: !!fieldState.error, helperText: fieldState.error?.message } }}
    />
  )}
/>
```

The same pattern wraps shadcn's `<Calendar>`, MUI's `<Autocomplete>`, react-select, etc. — anything that expects `value`/`onChange` instead of an HTML `ref`.

### Form patterns you'll meet

#### Confirm password (cross-field validation)

```ts
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],     // attach the error to the `confirm` field
});
```

#### Async validation (e.g. "username available?")

Two options. **Async refinement on the schema** — runs every parse, may be too eager:

```ts
const Schema = z.object({
  username: z.string().min(3).refine(async (name) => {
    const res = await fetch(`/api/users/check?name=${encodeURIComponent(name)}`);
    const { available } = await res.json();
    return available;
  }, { message: 'Username taken' }),
});
```

**Or** validate on blur with a custom `validate` in `register`:

```tsx
<input
  {...register('username', {
    validate: async (value) => {
      const r = await fetch(`/api/users/check?name=${encodeURIComponent(value)}`);
      const { available } = await r.json();
      return available || 'Username taken';
    },
  })}
/>
```

> **Which to use when:**
> - **`refine` (schema)** — for **cross-field** rules (`password === confirm`) and validations that belong with the data shape (server-shared schemas, code generation). Validation runs on every parse.
> - **Custom `validate` in `register`** — for **single-field, sporadic** async checks (username availability, slug uniqueness). Easier to debounce, easier to skip when the field hasn't changed.
>
> Real codebases mix the two: schema for shape and cross-field, `register({ validate })` for "ping the server" checks.

#### Dynamic field arrays

For a wishlist with N items, use `useFieldArray`:

```tsx
import { useFieldArray, useForm } from 'react-hook-form';

const WishlistSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url().optional().or(z.literal('')),
  })).min(1, 'Add at least one item'),
});
type WishlistInput = z.infer<typeof WishlistSchema>;

function WishlistForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: { items: [{ name: '', url: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {fields.map((field, idx) => (
        <div key={field.id}>
          <input {...register(`items.${idx}.name`)} placeholder="Name" />
          <input {...register(`items.${idx}.url`)} placeholder="URL (optional)" />
          <button type="button" onClick={() => remove(idx)}>Remove</button>
          {errors.items?.[idx]?.name && <span>{errors.items[idx]?.name?.message}</span>}
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', url: '' })}>+ Add item</button>
      <button type="submit">Save</button>
    </form>
  );
}
```

`fields[idx].id` is RHF's stable internal key — use it for the `key` prop, never the index.

#### Server-side validation errors mapped to fields

Backend returns `{ status: 422, errors: { email: 'Already registered' } }` — surface those:

```ts
const submit = async (data: LoginInput) => {
  try {
    await api.post('/auth/register', data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      Object.entries(err.fieldErrors ?? {}).forEach(([field, message]) => {
        setError(field as keyof LoginInput, { message: String(message) });
      });
    } else {
      setError('root.serverError', { message: (err as Error).message });
    }
  }
};
```

> **`ApiError` is from Lesson 09** — the typed API client introduced in the next lesson exposes `error.status` and `error.fieldErrors`. For now (until L09), substitute a plain duck-type:
> ```ts
> if (typeof (err as { status?: number }).status === 'number' && (err as any).status === 422) {
>   const fields = (err as any).fieldErrors as Record<string, string> | undefined;
>   /* ... */
> }
> ```

### Accessible forms — non-negotiable

- Every input has a `<label htmlFor="…">`. RHF doesn't change that — you still write the labels.
- Error messages: associate via `aria-describedby` and `aria-invalid` so screen readers announce them.
- `role="alert"` on the server-error block makes screen readers announce it the moment it appears.

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && <span id="email-error" role="alert">{errors.email.message}</span>}
```

A reusable `<FormField>` wrapper that does this for every field is a one-time investment that pays back across the codebase — Lesson 10 (Advanced React) shows one with `useId` for the IDs.

### React 19 — form actions and `useActionState`

React 19 added native form action support. You can pass a function directly to `<form action={...}>` and React handles the submission as a transition:

```tsx
import { useActionState } from 'react';

async function loginAction(_prev: State, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate with Zod the same way
  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: null };
  }

  try {
    await api.login(parsed.data);
    return { errors: null, message: 'ok' };
  } catch (err) {
    return { errors: null, message: (err as Error).message };
  }
}

type State = { errors: Record<string, string[]> | null; message: string | null };

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { errors: null, message: null });

  return (
    <form action={formAction}>
      {state.message && <div role="alert">{state.message}</div>}

      <label>Email <input name="email" type="email" /></label>
      {state.errors?.email && <span>{state.errors.email[0]}</span>}

      <label>Password <input name="password" type="password" /></label>
      {state.errors?.password && <span>{state.errors.password[0]}</span>}

      <button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign In'}</button>
    </form>
  );
}
```

**When to use which:**
- **RHF + Zod** — full client-side form mechanics (instant validation feedback, dynamic arrays, complex UI). The 95% case.
- **`useActionState`** — when the form maps cleanly to a server action (Next.js, Remix, or any backend you `fetch` to). It plays well with progressive enhancement (works without JS) and pairs with `useFormStatus` for nested submit-button state. Lesson 10 covers the pairing.

For `santa-app`, RHF + Zod is the right default — we're a SPA with a separate API.

## Learn More

- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
- [`useActionState` (React 19)](https://react.dev/reference/react/useActionState)
- [`useFormStatus` (React 19)](https://react.dev/reference/react-dom/hooks/useFormStatus)

## How to Work

1. **Study examples**:
   - `examples/login-form.tsx` — login with RHF + Zod, server-error mapping
   - `examples/register-form.tsx` — confirm password, async username check
   - `examples/wishlist-form.tsx` — dynamic field array with `useFieldArray`
   - `examples/action-state-form.tsx` — same login, with React 19 `useActionState`

2. **Complete exercises**:
   - `exercises/profile-form.tsx` — multi-section form with nested objects
   - `exercises/multi-step-checkout.tsx` — multi-step form, progress between steps without losing data

3. **Complete the App Task** below.

## App Task

> **You're rewriting form *logic*, not visuals.** L07 (UI Components, optional refactor) replaced raw inputs with MUI/shadcn primitives — that was the **visual layer**. L08 replaces the manual `useState`-per-field + ad-hoc validation with RHF + Zod — the **form-logic layer**. Both rewrites are valid and orthogonal: TextField from MUI is still a `<TextField>`, only what wraps it (RHF state) changes. If you skipped L07's refactor, you do this on top of your L03 styling — no problem.

### 1. Install

```bash
cd santa-app
npm install react-hook-form @hookform/resolvers zod
```

> `@hookform/resolvers` ships adapters for Zod, Yup, Joi, Valibot — we use `zodResolver`. One package, many schema libs.

**Verify §1:**
- [ ] `import { useForm } from 'react-hook-form'` resolves with no IDE warning.
- [ ] `import { zodResolver } from '@hookform/resolvers/zod'` resolves.
- [ ] `npm run dev` boots without errors.

### 2. Create reusable schema definitions

Create `src/schemas/auth.ts`:

```ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = LoginSchema.extend({
  displayName: z.string().min(2, 'At least 2 characters').max(50),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
```

**Verify §2:**
- [ ] `LoginSchema.safeParse({ email: 'bad', password: '123' })` returns `{ success: false }` with two issues.
- [ ] `LoginSchema.safeParse({ email: 'a@b.com', password: 'secret123' })` returns `{ success: true }`.
- [ ] `RegisterSchema.safeParse({ email: 'a@b.com', password: 'secret123', confirm: 'wrong', displayName: 'Alice' })` produces a `confirm` error path.
- [ ] `LoginInput` type in IDE shows `{ email: string; password: string }` (no manual interface needed).

### 3. Refactor `LoginForm` and `RegisterForm` to RHF + Zod

Replace the manual `useState`-per-field implementation. Form mechanics move to RHF:

- All fields wired via `register(...)` (or `Controller` if you went MUI in L07 — `<TextField>` works with `register` directly via `inputProps`).
- Submit handler from `handleSubmit(submit)`.
- Error display via `errors.fieldName?.message`.
- Submit button: `disabled={formState.isSubmitting}`.
- Server error from `auth.login(...)` rejecting → `setError('root.serverError', { message: err.message })`. Render at the top of the form via `errors.root?.serverError?.message`.

```tsx
const submit = async (data: LoginInput) => {
  try {
    await auth.login(data.email, data.password);
    // navigate(from) — already wired in L06
  } catch (err) {
    setError('root.serverError', { message: err instanceof Error ? err.message : 'Login failed' });
  }
};
```

> `RegisterForm` follows the same pattern with `RegisterSchema` and `auth.register(...)` (which you'll add to AuthContext if it isn't there yet — same shape as `auth.login`).

**Verify §3:**
- [ ] Submit empty form → field-level errors appear (no submission). Note: `disabled={isSubmitting}` only blocks the button **during** the async submit call, not while the form is invalid — RHF lets you click submit on an invalid form, then `handleSubmit` runs validation and refuses to call your handler. If you prefer button-disabled-while-invalid, use `disabled={!isValid || isSubmitting}` and pass `mode: 'onChange'` so `isValid` updates live.
- [ ] Submit with invalid email → `errors.email.message` shows under the email input.
- [ ] Submit valid creds against a wrong password → `errors.root.serverError.message` shows at the top.
- [ ] On success → form is reset / page navigates (whatever you wired in L06).
- [ ] React DevTools: there is **no** local `email`/`password`/`errors`/`submitting` state in the component — RHF tracks all of it.

### 4. Build a `WishlistEditor` (NEW component) for the room detail page

This component **doesn't exist yet** in your app. Render it on `RoomDetailPage` (the placeholder you wired in L06). For now the submit handler just `console.log`s the data — Lesson 09 wires the actual `PUT /api/rooms/:id/wishlist` API call.

Schema in `src/schemas/wishlist.ts`:

```ts
import { z } from 'zod';

export const WishlistSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, 'Required'),
    url: z.string().url('Invalid URL').optional().or(z.literal('')),
    priority: z.coerce.number().int().min(1).max(5).optional(),
  })).min(1, 'Add at least one item'),
});
export type WishlistInput = z.infer<typeof WishlistSchema>;
```

UI in `src/components/WishlistEditor.tsx`:

- List of wishlist items rendered via `useFieldArray` — `key={field.id}`, NOT index.
- Per-row inputs for `name` (required), `url` (optional, URL-validated), `priority` (optional 1-5, `z.coerce.number()` because `<input type="number">` produces a string).
- "+ Add item" button → `append({ name: '', url: '', priority: undefined })`.
- Per-item "Remove" → `remove(idx)`. Disabled when `fields.length === 1` (schema requires at least one).
- "Save" submit button — `handleSubmit((data) => console.log(data))` for now.
- `defaultValues: { items: [{ name: '' }] }` so the user starts with one empty row.

Mount it in `RoomDetailPage`:
```tsx
function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <NotFound />;
  return (
    <>
      <h2>Room {id}</h2>
      <WishlistEditor />          {/* L09 wires it to GET/PUT /api/rooms/:id/wishlist */}
    </>
  );
}
```

**Verify §4:**
- [ ] Open `/rooms/abc` (any room id) → wishlist editor renders with one empty item row.
- [ ] Click "+ Add item" → a new row appears, inputs are isolated per row (typing in row 1 doesn't bleed into row 2).
- [ ] Add 3 items, remove the middle one → the **same item state stays attached to each remaining row** (this only works because of `field.id` as key, not index).
- [ ] Submit with one row's name empty → row-level error appears, no submit happens.
- [ ] Submit with `url: 'not-a-url'` → URL error, no submit.
- [ ] Submit with 3 valid items → `console.log` shows the array. No real API call yet (that's L09).

### 5. Accessibility audit

For every form field (login, register, wishlist):

- [ ] There is a `<label htmlFor="...">` matching the input's `id`. Each input has a unique `id` (use `useId()` from L05/L10 if you have many).
- [ ] Inputs that have errors show `aria-invalid="true"` and `aria-describedby` pointing to the error span's id.
- [ ] The error span has `role="alert"` so screen readers announce it the moment it appears.
- [ ] Server-error block at the top of the form also has `role="alert"`.
- [ ] You can reach every input by Tab. The submit button is reachable last. Pressing Enter inside any text field submits the form.

> Lesson 11 (Testing) will write tests that fail if any of these regress. For now — manual audit with browser DevTools + a screen reader (macOS VoiceOver: Cmd+F5) is enough.

### What you have now

A consistent form layer in santa-app: every form passes through Zod, errors are typed (`errors.fieldName?.message`), server errors flow back into the form via `setError('root.serverError', ...)`, accessibility is on by default. Lesson 09 will replace the data-fetching layer the same way — manual `fetch` becomes TanStack Query, `useApi` becomes a typed module.
