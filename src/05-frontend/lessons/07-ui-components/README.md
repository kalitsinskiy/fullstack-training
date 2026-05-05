# UI Components: MUI vs Tailwind + shadcn/ui

## Quick Overview

Building polished UIs from scratch is slow and error-prone. Real teams pick one of two strategies:

1. **A component library** — pre-built `<Button>`, `<Dialog>`, `<DataGrid>`. You import; you don't style. Example: **Material UI (MUI)**.
2. **Utility classes + copy-paste primitives** — you assemble components from Tailwind utilities, optionally seeded by **shadcn/ui** (a registry of components you copy *into your codebase* and own). Built on accessible primitives like Radix UI.

This lesson is the conceptual map. We don't build a full design system — we show what each approach looks like and when to pick which.

> Lesson 03 introduced styling foundations. This lesson is about the **component layer** on top.

## Quick Recommendation

| Situation | Pick |
|---|---|
| Internal tool, dashboards, enterprise app | **MUI** — fast to build, accessible by default, professional out of the box |
| Marketing site, design-heavy product, you want full control | **Tailwind + shadcn/ui** — every pixel is yours |
| Existing codebase already standardized | Stay with what's there |

For `santa-app`, both are valid. The App Task lets you pick.

## Material UI (MUI)

The most popular React component library. Components are pre-styled, accessible, and themed. You spend time **composing** rather than **styling**.

### Setup

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material   # optional: icons
```

Wrap the app:

```tsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary:   { main: '#2d5a27' },   // matches santa-app's primary (set in Lesson 03)
    secondary: { main: '#6c757d' },
    error:     { main: '#c0392b' },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />     {/* resets browser styles, applies theme */}
      <Routes />
    </ThemeProvider>
  );
}
```

### The `sx` prop — style anywhere with theme tokens

```tsx
import { Box, Typography } from '@mui/material';

<Box sx={{
  p: 2,                       // padding: theme.spacing(2) = 16px
  mt: 3,                      // marginTop: theme.spacing(3) = 24px
  bgcolor: 'primary.main',    // from palette
  color: 'white',
  borderRadius: 1,
  display: 'flex',
  gap: 2,
  '&:hover': { opacity: 0.9 },
  width: { xs: '100%', md: '50%' },   // responsive
}}>
  <Typography variant="h6">Hello</Typography>
</Box>
```

`sx` is MUI's answer to "write CSS-in-JS without leaving JSX". Theme tokens (`primary.main`, `text.secondary`, spacing units, breakpoints `xs`/`sm`/`md`) keep your UI consistent.

### Common components

```tsx
import {
  AppBar, Toolbar, Typography, Button,
  Container, Card, CardContent, CardActions,
  TextField, Box, Grid, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton,
} from '@mui/material';
import { Add, Delete, Logout } from '@mui/icons-material';

// AppBar
<AppBar position="static">
  <Toolbar>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>Santa App</Typography>
    <Button color="inherit" startIcon={<Logout />}>Logout</Button>
  </Toolbar>
</AppBar>

// Card
<Card sx={{ maxWidth: 345 }}>
  <CardContent>
    <Typography variant="h5">Office Party 2025</Typography>
    <Typography color="text.secondary">8 members</Typography>
  </CardContent>
  <CardActions>
    <Button size="small">Open</Button>
  </CardActions>
</Card>

// TextField with built-in error state
<TextField
  label="Email"
  type="email"
  fullWidth
  required
  error={!!errorMsg}
  helperText={errorMsg}
/>

// Dialog (controlled)
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Create Room</DialogTitle>
  <DialogContent>
    <TextField label="Room name" fullWidth sx={{ mt: 1 }} />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleCreate}>Create</Button>
  </DialogActions>
</Dialog>
```

> **MUI v6+ — `Grid` v2 syntax**: in v6 the Grid layout switched to `<Grid size={{ xs: 12, md: 6 }}>` (or shorthand `<Grid size={6}>`). Old `<Grid xs={12} md={6}>` still works but emits a deprecation warning. If you see legacy code with `xs`/`md` props, that's pre-v6 — fine to keep, just don't write new code that way.

### Pros and cons

| ✅ | ❌ |
|---|---|
| Fastest path from zero to a usable UI | Distinct "Material" look — recognizable, sometimes unwanted |
| Components are accessible out of the box | Bundle size adds up if you use many components |
| Mature: every common widget exists (DataGrid, DatePicker, Autocomplete) | Customizing past the theme is fiddly (`sx` everywhere) |
| Excellent TypeScript types | Lock-in: components are *imported* — switching out is rewriting |

## Tailwind + shadcn/ui

A different philosophy: instead of importing a library, you **own the components**. shadcn/ui is a CLI that copies code (component files) into your project — you can read them, edit them, fork them.

The components are built on **Radix UI primitives** (unstyled, fully accessible) plus **Tailwind classes** for the look.

### The mental model

```
Tailwind          → utility CSS classes (Lesson 03)
Radix UI          → headless, accessible primitives (Dialog, Popover, etc.)
shadcn/ui         → opinionated styled components built from Tailwind + Radix,
                    delivered as code you paste into your repo
```

You install **Tailwind** as you would normally. Then you run the shadcn CLI per component:

```bash
npx shadcn@latest init                    # one-time setup
npx shadcn@latest add button              # adds src/components/ui/button.tsx
npx shadcn@latest add dialog input card   # add more as needed
```

This **doesn't add a dependency** — it adds files. The component is yours.

### What a shadcn component looks like (Button)

```tsx
// src/components/ui/button.tsx — generated by shadcn, you can edit it
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:   'border border-input bg-background hover:bg-accent',
        ghost:     'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-9 px-3',
        lg:      'h-11 px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = 'Button';
```

Read it. Edit it. Add a `success` variant. Delete the ones you don't use. **It's your code.**

Usage looks identical to MUI:

```tsx
import { Button } from '@/components/ui/button';

<Button variant="secondary" size="lg" onClick={save}>Save</Button>
<Button variant="destructive" disabled>Delete</Button>
```

### What `cva` and `cn` do

- **`cva`** (class-variance-authority) — defines variant maps and produces a function that returns the right class string for given props. Type-safe.
- **`cn`** — usually `clsx` + `tailwind-merge`. Combines class names and **resolves conflicts** (`p-4 p-6` → `p-6`).

These two helpers are the core of any modern Tailwind component pattern, with or without shadcn.

### Building the Card with Tailwind primitives

shadcn ships a `<Card>` primitive, but the point is you'd own the file. Here's the same thing hand-written:

```tsx
function RoomCard({ name, memberCount }: Props) {
  return (
    <article className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition">
      <header className="p-6 pb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
      </header>
      <div className="px-6 pb-2">
        <p className="text-sm text-muted-foreground">{memberCount} members</p>
      </div>
      <footer className="flex items-center px-6 py-4">
        <Button size="sm">Open</Button>
      </footer>
    </article>
  );
}
```

### Pros and cons

| ✅ | ❌ |
|---|---|
| Every component is yours — no library lock-in | More upfront work |
| No prescribed "look" — design freedom | Need design discipline (accessibility, consistency) |
| Tiny bundle (only what you use) | "Yet another stack" — Tailwind + Radix + cva + cn |
| Deeply customizable per-component | Less stuff out of the box (no DataGrid, no DatePicker — you build/install) |

## Side-by-side: same component, two stacks

A login form button:

```tsx
// MUI
<Button
  type="submit"
  variant="contained"
  color="primary"
  size="large"
  disabled={loading}
  fullWidth
  startIcon={loading ? <CircularProgress size={16} /> : undefined}
>
  {loading ? 'Signing in…' : 'Sign In'}
</Button>

// Tailwind + shadcn (or hand-rolled)
<Button type="submit" disabled={loading} className="w-full" size="lg">
  {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? 'Signing in…' : 'Sign In'}
</Button>
```

Different syntax, same UI. The **mental cost** of MUI is *learning the library API* (`variant`, `color`, `size`, `startIcon`). The mental cost of Tailwind+shadcn is *learning the utility classes* (`w-full`, `mr-2`, `h-4`, `animate-spin`).

## How to choose

Ask yourself:
1. **Time to first usable screen** — MUI wins.
2. **Long-term flexibility, brand differentiation** — Tailwind+shadcn wins.
3. **Team's existing skills** — go with the stack people already know.
4. **Bundle size matters?** — Tailwind+shadcn is smaller.
5. **Need exotic widgets?** (DataGrid, DateRangePicker) — MUI ships them, shadcn means you find/build them.

## Learn More

- [Material UI](https://mui.com/material-ui/getting-started/)
- [MUI sx prop](https://mui.com/system/getting-started/the-sx-prop/)
- [Tailwind CSS](https://tailwindcss.com/) (re-link from Lesson 03)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI primitives](https://www.radix-ui.com/primitives) (the headless layer under shadcn)
- [class-variance-authority (cva)](https://cva.style/)
- [`tailwind-merge`](https://github.com/dcastil/tailwind-merge)

## How to Work

1. **Study examples**:
   - `examples/mui-components.tsx` — showcase of MUI primitives you'll use the most
   - `examples/shadcn-concept.tsx` — what a shadcn-style Card + Dialog look like (read-only — generated code is too long for a runnable demo, this is the conceptual shape)

2. **Complete exercise**:
   - `exercises/build-room-card.tsx` — same RoomCard, two ways. Pick MUI **or** shadcn-style and complete one.

3. **Complete the App Task** below.

## App Task

> **You're upgrading the visual layer, not the structure.** `LoginForm`, `RegisterForm`, `RoomCard`, `Layout` already exist and work — built in Lessons 03-06 with controlled inputs (L04), AuthContext wiring (L05), and routing (L06). The component shapes don't change. What changes is **which primitives you import**: your own CSS Modules / Tailwind classes vs MUI's `<Button>` or shadcn's `<Button>`.

### How this lesson interacts with Lesson 03's choice — the matrix

You picked a **styling system** in L03 (CSS Modules or Tailwind utilities). You're now picking a **component primitives layer** on top. Not all combinations are equally clean:

| L03 choice | L07 choice | Coexistence story |
|---|---|---|
| **Tailwind utilities** | **Tailwind + shadcn primitives** | ✅ Natural continuation — same stack, just adds Radix-based primitives |
| **CSS Modules** | **MUI** | ✅ Reasonable — MUI handles primitives (Button, Dialog, Card), CSS Modules handles app-specific layout / page shells. Two layers, no conflict |
| **CSS Modules** | **Tailwind + shadcn** | ⚠️ You're adding a second styling system. Tailwind is required for shadcn. Either run them in parallel (Modules for layout, Tailwind for shadcn primitives) or migrate Modules → Tailwind. Both work but add complexity |
| **Tailwind utilities** | **MUI** | ⚠️ Two systems doing the same job. Avoid if possible — pick one or the other |

**Recommendation for `santa-app`:**
- If L03 was Tailwind → continue with **Path B (Tailwind + shadcn)** here.
- If L03 was CSS Modules → either path works. Path A (MUI) keeps your CSS Modules layer for layout/page-shell styles. Path B requires installing Tailwind alongside.

### Pick **one** path and stick with it. Don't mix MUI and shadcn in the same app.

---

### Path A: Material UI

#### A.1 Install + theme

```bash
cd santa-app
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

Wrap `<App />` (or `<RouterProvider>`) in `<ThemeProvider>` + `<CssBaseline />`. Define a theme with your primary/secondary colors — reuse the values from your L03 CSS variables if you have them:

```tsx
const theme = createTheme({
  palette: {
    primary:   { main: '#2d5a27' },
    secondary: { main: '#6c757d' },
    error:     { main: '#c0392b' },
  },
});
```

**Verify A.1:**
- [ ] App renders without errors. The default browser button (somewhere in your existing UI) now picks up MUI's CssBaseline reset.
- [ ] React DevTools shows `<ThemeProvider>` near the root.

#### A.2 (REQUIRED — net new) Build the **Create Room dialog** with MUI

This component **doesn't exist yet** in your app. It's the net-new value of this lesson — it teaches you the MUI primitives in a real flow.

- Add an `<IconButton><Add /></IconButton>` to your existing `Layout` header.
- On click, open an MUI `<Dialog>` containing:
  - `<DialogTitle>Create Room</DialogTitle>`
  - `<DialogContent>` with a `<TextField label="Room name" fullWidth required />`
  - `<DialogActions>` with `Cancel` (closes) and `Create` (`variant="contained"`).
- Wire the form to a controlled `useState` for the name. Submit handler — `console.log({ name })` for now (Lesson 09 wires the real `POST /api/rooms`).

**Verify A.2:**
- [ ] Click the AppBar's `+` icon → dialog opens with focus inside the TextField.
- [ ] Press Esc → dialog closes (Radix-style focus management is built in).
- [ ] Type a room name + click Create → console logs `{ name: '...' }` and dialog closes.
- [ ] Tab through dialog → focus is trapped inside (a11y win for free).

#### A.3-A.5 (OPTIONAL — refactor existing components)

If your team is committing to MUI as the long-term UI library, refactor what L03-L06 built. Skip these if you're just sampling MUI for awareness — your existing CSS Modules / Tailwind components are fine.

- **A.3** `Layout` header → `<AppBar>` + `<Toolbar>` + `<Container>` + `<Button color="inherit" startIcon={<Logout />}>Logout</Button>`.
- **A.4** `LoginForm` / `RegisterForm` → `<TextField>` per input (using `error` + `helperText` from L04 validation state) + `<Button type="submit" variant="contained" fullWidth>`.
- **A.5** `RoomCard` → `<Card><CardContent><Typography variant="h6">…</Typography></CardContent><CardActions><Button>Open</Button></CardActions></Card>` plus a `<Chip>` for the status badge.

**Verify A.3-A.5 (if you did them):**
- [ ] App still works end-to-end: login, navigate to rooms, see cards.
- [ ] No console warnings about deprecated MUI APIs (especially `Grid` — see the v2 note above).
- [ ] Form validation errors still display via `error` + `helperText` (not your old custom error spans).

---

### Path B: Tailwind + shadcn-style

#### B.1 Install Tailwind (skip if you did this in L03)

```bash
cd santa-app
npm install -D tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge class-variance-authority
```

- Add `tailwindcss()` to `vite.config.ts` plugins.
- Add `@import "tailwindcss";` to `src/index.css`.

#### B.2 Set up the `cn` helper and the `@/` import alias

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

shadcn's generated code uses an **`@/`** path alias (e.g. `import { cn } from '@/lib/utils'`). Wire it once:

```ts
// vite.config.ts
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

```jsonc
// tsconfig.json (compilerOptions)
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

> Running `npx shadcn@latest init` does most of this automatically. The manual snippet above is for the hand-roll path or if you want to read what shadcn changes.

#### B.3 Add primitives — `Button`, `Card`, `Dialog`, `Input`, `Label`

```bash
npx shadcn@latest init     # answer the prompts; pick the defaults if unsure
npx shadcn@latest add button card dialog input label
```

Or hand-roll using the patterns from `examples/shadcn-concept.tsx` (the `cva`-based Button + Card composition you already read).

**Verify B.1-B.3:**
- [ ] `import { Button } from '@/components/ui/button'` resolves with no IDE warning.
- [ ] Drop a `<Button variant="default">Test</Button>` in `App.tsx` — renders with Tailwind classes applied.
- [ ] Inspect element in DevTools — classes look like `bg-primary text-primary-foreground …`.

#### B.4 (REQUIRED — net new) Build the **Create Room dialog** with shadcn primitives

Same component as A.2. This is the net-new value of the lesson.

- Add a `<Button>+</Button>` (or icon button) to your existing `Layout` header.
- On click, open a shadcn `<Dialog>` containing:
  - `<DialogHeader><DialogTitle>Create Room</DialogTitle></DialogHeader>`
  - An `<Input>` + `<Label>` pair for the room name.
  - `<DialogFooter>` with `Cancel` (`variant="outline"`) and `Create` buttons.
- Wire the form to controlled `useState`. Submit handler — `console.log({ name })` for now.

**Verify B.4:**
- [ ] Click the header's `+` button → dialog opens with focus inside the Input.
- [ ] Press Esc → dialog closes.
- [ ] Tab through dialog → focus is trapped inside (Radix gives you this).
- [ ] Click outside the dialog → it closes (also Radix default).
- [ ] Type + Create → console logs `{ name: '...' }`.

#### B.5 (OPTIONAL — refactor existing components)

Same logic as A.3-A.5: do this only if committing to shadcn-style as the long-term UI primitives layer. Otherwise the existing Tailwind classes from L03 are perfectly fine.

- Replace raw `<button className="…">` with shadcn `<Button>` everywhere.
- Replace raw `<input>` with shadcn `<Input>` + `<Label>`.
- Wrap the room card markup with shadcn `<Card>` / `<CardHeader>` / `<CardContent>` / `<CardFooter>`.

**Verify B.5 (if you did it):**
- [ ] No raw `<button className="…">` in the app — all wrapped via the shadcn `Button` primitive.
- [ ] Forms still pass validation (state from L04 still drives `:focus-visible`, error display).
- [ ] The Create Room dialog from B.4 fits visually — same primitives, same look.

---

### Either path: the deliverable

A polished UI for the **Create Room** flow built with the library you chose, plus the existing app screens still working. If you took on the optional refactor (A.3-A.5 or B.5), the whole UI feels uniform — same Button, same Card, same Dialog everywhere. If you didn't, your old components from L03-L06 keep working alongside the new dialog. **Either is a valid stopping point** for this lesson.
