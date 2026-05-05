# Styling in React

## Quick Overview

CSS in React goes beyond a single global stylesheet. You need a way to **scope styles to a component**, **handle dynamic styles based on props or state**, and **share design tokens** across the app. This lesson compares the three approaches you will see in real codebases — **CSS Modules**, **Tailwind CSS**, and **Styled Components** — by building the same Button + Card component with each one and laying out the trade-offs.

> Lesson 02 covered the CSS language itself. This lesson is about *organizing* CSS in a React project.

## Quick Recommendation

| You want… | Pick |
|---|---|
| Zero runtime cost, plain CSS, scoped to components | **CSS Modules** |
| Fast prototyping, design system constraints, smallest bundle | **Tailwind CSS** |
| Heavy prop-driven dynamic styles, theming via JS | **Styled Components** (legacy projects) |

For new projects in 2025-2026, **Tailwind** is the dominant choice. **CSS Modules** is the safe boring default. **Styled Components** is in maintenance mode (RSC and SSR limitations) — use it only when an existing codebase already has it.

## Key Concepts

### Why scope styles?

Plain CSS with global classes leads to collisions: two engineers both write `.card`, one breaks the other. The three approaches solve this differently:

| Approach | Scoping mechanism |
|---|---|
| CSS Modules | Build tool rewrites class names to be unique (`Button_button_x7d2k`) |
| Tailwind | No custom class names — only utility primitives applied inline (`bg-blue-500 px-4`) |
| Styled Components | Class names generated at runtime; `<Button>` component is the unit, not a class name |

### Building the same Button — three ways

The output is identical: a primary/secondary/danger button with size variants, hover state, and disabled state. The code organization is what differs.

#### Approach 1: CSS Modules

```css
/* Button.module.css */
.button {
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}

.button:hover { opacity: 0.85; }
.button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Variants */
.primary   { background: var(--color-primary);   color: white; }
.secondary { background: var(--color-secondary); color: white; }
.danger    { background: var(--color-danger);    color: white; }

/* Sizes */
.sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
.md { padding: 0.5rem 1.25rem;  font-size: 1rem; }
.lg { padding: 0.75rem 2rem;    font-size: 1.125rem; }
```

```tsx
// Button.tsx
import { clsx } from 'clsx';
import styles from './Button.module.css';

// `ComponentPropsWithoutRef<'button'>` inherits all native button props (onClick, type, disabled, aria-*, …).
// This pattern is covered in detail in Lesson 04 (React Fundamentals → TypeScript Patterns).
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    />
  );
}
```

```tsx
// Usage
<Button variant="primary" size="lg" onClick={save}>Save</Button>
<Button variant="danger" disabled>Delete</Button>
```

#### Approach 2: Tailwind CSS

```tsx
// Button.tsx — no separate file needed
import { clsx } from 'clsx';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-slate-600 text-white hover:bg-slate-700',
  danger:    'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-8 py-3 text-lg',
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-md font-medium transition-opacity',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}
```

#### Approach 3: Styled Components

> The example below reads `theme.colors.primary` from the SC theme — the app must be wrapped in `<ThemeProvider theme={…}>` somewhere above (see "Theming compared" later). Without it, `theme` is `undefined` and the styled component will throw.

```tsx
// Button.tsx
import styled, { css } from 'styled-components';

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger';
  $size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary:   css`background: ${({ theme }) => theme.colors.primary};   color: white;`,
  secondary: css`background: ${({ theme }) => theme.colors.secondary}; color: white;`,
  danger:    css`background: ${({ theme }) => theme.colors.danger};    color: white;`,
};

const sizeStyles = {
  sm: css`padding: 0.25rem 0.75rem; font-size: 0.875rem;`,
  md: css`padding: 0.5rem 1.25rem;  font-size: 1rem;`,
  lg: css`padding: 0.75rem 2rem;    font-size: 1.125rem;`,
};

export const Button = styled.button<ButtonProps>`
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;

  ${({ $variant = 'primary' }) => variantStyles[$variant]}
  ${({ $size = 'md' }) => sizeStyles[$size]}

  &:hover    { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
```

> **The `$` prefix on Styled Components props** — `$variant` instead of `variant` — tells SC: "don't forward this prop to the underlying `<button>` element." Without `$`, you'd get a React warning that `variant` is not a valid HTML attribute.

### Approach details

#### CSS Modules

**Setup:** zero — Vite supports `*.module.css` out of the box.

**File structure** — colocate the styles with the component:

```
src/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.css
│   └── index.ts          (re-exports Button)
├── Card/
│   ├── Card.tsx
│   ├── Card.module.css
│   └── index.ts
```

For tiny components a flat `Button.tsx` + `Button.module.css` next to each other is also fine. Either way, the rule: **one module per component**.

**Class names — `clsx` over template literals:**

```tsx
import { clsx } from 'clsx';
import styles from './Button.module.css';

<button className={clsx(
  styles.button,
  styles[variant],
  isActive && styles.active,
  className,
)}>
```

`clsx` accepts strings, falsy values (skipped), and objects (`{ active: isActive }`) — much cleaner than `${a} ${b ? styles.x : ''} ${c ?? ''}`.

**Global styles** — regular `.css` file (no `.module`), imported once in `main.tsx`:

```ts
// src/main.tsx
import './index.css';
```

```css
/* src/index.css — resets, design tokens, typography */
*, *::before, *::after { box-sizing: border-box; }
:root { --color-primary: #2d5a27; --space-3: 1rem; --radius: 0.5rem; }
body { font-family: system-ui, sans-serif; }
```

**Escaping the scope: `:global`** — when you must reach a class name that the build tool shouldn't rename (e.g. integration with a third-party library):

```css
/* MyComponent.module.css */
.wrapper :global(.third-party-class) { padding: 1rem; }
```

Use sparingly — every `:global` is a hidden coupling.

**Sharing styles: `composes`** — extract a base style, mix it into variants without duplicating:

```css
/* Button.module.css */
.base { padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; }
.primary {
  composes: base;
  background: var(--color-primary);
  color: white;
}
.danger {
  composes: base;
  background: var(--color-danger);
  color: white;
}
```

The `styles.primary` class compiled now contains both the `.base` and `.primary` hashes. This is CSS Modules's answer to «extract shared rules without making a `<Button>` React component just for that».

**Theming** — define `--color-primary` etc. in your global stylesheet (`:root` + `[data-theme="dark"]` overrides). Reference `var(--color-primary)` inside modules. No special wiring needed.

#### Tailwind CSS

Setup in a Vite project:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css */
@import "tailwindcss";
```

That's the entire setup. From there, every utility class works (`bg-blue-500`, `flex`, `gap-4`, `md:grid-cols-3`, ...).

**Core ideas:**
- **Utility-first** — no custom class names, just primitives. `bg-blue-500 px-4 py-2 rounded-md`.
- **Responsive prefixes** — `md:flex-row` means "flex-row from medium breakpoint up".
- **State variants** — `hover:bg-blue-700`, `focus:ring-2`, `disabled:opacity-50`.
- **Arbitrary values** — when you really need a one-off: `mt-[13px]`, `bg-[#fa3]`.
- **`clsx` for conditional classes** — same helper as CSS Modules.

```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition">
  <img src={room.cover} className="w-16 h-16 rounded-full object-cover" alt="" />
  <div>
    <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
    <p className="text-sm text-slate-500">{room.memberCount} members</p>
  </div>
</div>
```

**Theme customization** lives in `tailwind.config.js` (or `@theme` block in v4). Tokens become utility classes:

```css
/* Tailwind v4 syntax */
@theme {
  --color-brand: oklch(0.6 0.18 250);
  --spacing-tight: 0.25rem;
}
```

Then `bg-brand`, `p-tight` etc. are valid classes.

**Why so many people love it:**
- Zero context-switching — no jumping between `.css` files
- Consistent spacing/colors enforced by the design tokens
- Tree-shaken: unused utilities don't ship
- IDE autocomplete is excellent with the official extension

**Common objection — "the className gets long"**: yes. Mitigations: extract complex blocks into components (`<Card>`), use `cva` (class-variance-authority) for variant patterns, use `@apply` sparingly in CSS for shared snippets.

**Editor + Prettier setup — must-haves for DX**:

- **VS Code Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — autocomplete, color preview inline, hover for the underlying CSS.
- **`prettier-plugin-tailwindcss`** — auto-sorts utility classes into the project-wide canonical order. Two PRs writing `flex p-4` vs `p-4 flex` end up identical in diff.

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

```json
// .prettierrc
{ "plugins": ["prettier-plugin-tailwindcss"] }
```

**Tailwind v3 vs v4** — this lesson shows v4 (`@tailwindcss/vite` + `@import "tailwindcss"` + `@theme` block). Many existing codebases still use **v3**: PostCSS plugin (`tailwindcss + autoprefixer`) wired in `postcss.config.js`, content scanned via `tailwind.config.js`'s `content: [...]` array, theme tokens defined in `theme.extend = { colors: {...} }`. The utility classes are 95% the same — migration pain is mostly the config plumbing, not the components.

#### Styled Components

```bash
npm install styled-components
npm install -D @types/styled-components
```

- Class names are generated at runtime — every render injects `<style>` blocks
- **Theming** — wrap the app in `<ThemeProvider theme={...}>`, access via `${({ theme }) => theme.colors.primary}`
- Supports prop-based styling, `as` polymorphism (`<Button as="a" href="...">`), animations via `keyframes`
- **The downside today**: SSR setup is non-trivial, **does not support React Server Components**, runtime cost (~12 KB), the React core team explicitly recommended migrating away from runtime CSS-in-JS in 2022. The library itself is in maintenance mode.
- **Use it when**: you maintain an existing codebase that already uses it. Don't pick it for a new project.

A modern CSS-in-JS alternative if you really need it is **vanilla-extract** (zero-runtime) or **Panda CSS** — they keep the developer experience but compile away to plain CSS.

### Theming compared

The same `--color-primary` design token, three ways. CSS variables fundamentals are in [Lesson 02](../02-css-basics/README.md#css-custom-properties-variables) — this section is just how each approach **wires them**:

```css
/* CSS Modules + plain CSS (works in any approach) */
:root { --color-primary: #2d5a27; }
[data-theme="dark"] { --color-primary: #4caf50; }

.button { background: var(--color-primary); }
```

```css
/* Tailwind v4 */
@theme { --color-primary: #2d5a27; }
@layer base {
  [data-theme="dark"] { --color-primary: #4caf50; }
}
/* Use as: bg-primary */
```

```tsx
/* Styled Components */
<ThemeProvider theme={{ colors: { primary: '#2d5a27' } }}>
  <App />
</ThemeProvider>
// In a styled component: background: ${({ theme }) => theme.colors.primary};
```

CSS variables (option 1) work in **all three** — and they update at runtime, free, no React re-render needed. Whatever stack you pick, learn CSS variables.

### Pseudo-elements + state variants in each approach

> **Basics live in [Lesson 02](../02-css-basics/README.md)** — `:hover`, `:focus-visible`, `:disabled`, `transition`, `@keyframes`, `prefers-reduced-motion`. We don't repeat them here. This section is about how each React-styling approach **expresses** those features, plus pseudo-elements (not covered in L02).

**Pseudo-elements** (`::before`, `::after`) — virtual children rendered by CSS, useful for decorative bits without extra HTML:

```css
/* "Required" indicator on form labels */
.required-label::after { content: " *"; color: var(--color-danger); }

/* Tooltip arrow — no extra HTML needed */
.tooltip::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: var(--color-tooltip-bg);
}
```

**State variants — same CSS feature, three syntaxes:**

| State | CSS Modules / plain CSS | Tailwind | Styled Components |
|---|---|---|---|
| Hover | `.button:hover { ... }` | `hover:bg-blue-700` | `&:hover { ... }` |
| Keyboard focus | `.button:focus-visible { ... }` | `focus-visible:ring-2 focus-visible:ring-offset-2` | `&:focus-visible { ... }` |
| Disabled | `.button:disabled { ... }` | `disabled:opacity-50 disabled:cursor-not-allowed` | `&:disabled { ... }` |
| Even rows (zebra) | `.row:nth-child(even) { ... }` | `even:bg-slate-50` | `&:nth-child(even) { ... }` |
| Group hover (parent state) | `.parent:hover .child { ... }` (descendant selector) | `group-hover:opacity-100` (parent has `group`) | `&:hover .child { ... }` |
| Container queries | `@container (min-width: 400px) { ... }` | `@container` + `@sm:flex-row` | not native (use `styled-components` + `@container` raw) |

> **Animations** — Tailwind v4 has built-ins (`animate-spin`, `animate-pulse`, `animate-bounce`) and `transition`/`transition-colors`/`duration-200`/`ease-out` modifiers. Custom keyframes still go in CSS (`@keyframes fadeIn`) — then reference as `animate-[fadeIn_0.2s_ease-out]` or register in the theme.

## Final comparison

| | CSS Modules | Tailwind | Styled Components |
|---|---|---|---|
| Scoping | Build-time hash | Inherent (utility classes) | Runtime hash |
| Dynamic styles | CSS variables | Conditional classes (`clsx`) | Props-based (full JS power) |
| Bundle | Just CSS, 0 KB JS | Just CSS, 0 KB JS (purged) | ~12 KB runtime |
| RSC / SSR | Works | Works | Limited / setup needed |
| TS support | Limited (class names typed manually) | Excellent (with plugin) | Full props typing |
| Theming | CSS variables (best) | Theme tokens + CSS variables | ThemeProvider |
| Learning curve | Low | Medium (memorize utilities) | Medium (CSS-in-JS mental model) |
| Community trend (2025+) | Stable | Growing | Maintenance mode |

## Learn More

- [MDN: CSS Modules pattern](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_modules)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui — copy-paste components on Tailwind](https://ui.shadcn.com/) — covered in Lesson 07
- [`clsx` — conditional class names](https://github.com/lukeed/clsx)
- [class-variance-authority (cva)](https://cva.style/) — variant patterns for Tailwind
- [Why we're breaking up with CSS-in-JS](https://dev.to/srmagura/why-were-breaking-up-wiht-css-in-js-4g9b) — the maintenance-mode rationale
- [vanilla-extract](https://vanilla-extract.style/) — zero-runtime CSS-in-JS
- [Panda CSS](https://panda-css.com/) — modern CSS-in-JS that compiles away

## How to Work

1. **Study examples** — different file types need different setup:
   - **HTML demos** (`css-variables.html`, `responsive.html`) — double-click to open in browser, or via Vite dev server (copy into `santa-app/public/` and access at `http://localhost:5173/<path>`).
   - **React demos** — copy into `santa-app/src/`, import the default export in `App.tsx`. Each needs the relevant npm package installed (Tailwind, styled-components).

   ```
   src/05-frontend/lessons/03-css-advanced/examples/css-modules-demo/             (read; needs Vite to actually run)
   src/05-frontend/lessons/03-css-advanced/examples/tailwind-demo.tsx             (needs Tailwind installed)
   src/05-frontend/lessons/03-css-advanced/examples/styled-components-demo.tsx    (needs styled-components installed)
   src/05-frontend/lessons/03-css-advanced/examples/css-variables.html            (open directly in browser)
   src/05-frontend/lessons/03-css-advanced/examples/responsive.html
   ```

2. **Complete exercises** — follow the TODO comments:
   ```
   src/05-frontend/lessons/03-css-advanced/exercises/responsive-page.html + .css   (open .html in browser)
   src/05-frontend/lessons/03-css-advanced/exercises/styled-button.tsx              (run in a Vite project with styled-components)
   ```

3. **Complete the App Task** below.

## App Task

### 1. Pick a styling approach for `santa-app`

Decide between **CSS Modules** and **Tailwind**. Either is fine — but commit to one for the whole app. Don't mix.

> If you styled the mockups in Lesson 02 with plain CSS, you'll migrate them here.

**Path A — CSS Modules:**

Vite supports `*.module.css` out of the box — no install. Add a global `src/index.css` (imported in `main.tsx`) with reset + design tokens:

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
body { font-family: system-ui, sans-serif; line-height: 1.6; color: var(--color-text); background: var(--color-bg); }

:root {
  --color-primary: #2d5a27;
  --color-primary-dark: #1e3d1a;
  --color-secondary: #6c757d;
  --color-danger: #c0392b;
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #333;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 1rem; --space-4: 1.5rem; --space-5: 2rem;
  --radius: 0.5rem;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-surface: #262626;
  --color-text: #f0f0f0;
}
```

Install `clsx`:
```bash
cd santa-app
npm install clsx
```

**Path B — Tailwind v4:**

```bash
cd santa-app
npm install -D tailwindcss @tailwindcss/vite prettier prettier-plugin-tailwindcss
npm install clsx
```

`vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Replace `src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-brand:        #2d5a27;
  --color-brand-dark:   #1e3d1a;
  --color-danger:       #c0392b;
  --spacing-card:       1.5rem;
  --radius-card:        0.5rem;
}
```

Add `.prettierrc`:
```json
{ "plugins": ["prettier-plugin-tailwindcss"] }
```

Install the **VS Code Tailwind CSS IntelliSense** extension (`bradlc.vscode-tailwindcss`) — the autocomplete is what makes the utility-first workflow comfortable.

**Verify §1:**
- [ ] `npm run dev` boots without errors
- [ ] Open DevTools → Elements → `<body>` → Computed → `font-family` shows `system-ui` (CSS Modules) or Tailwind's reset (Tailwind)
- [ ] CSS Modules path: typing `var(--color-primary)` in any module gives the right green
- [ ] Tailwind path: typing `bg-brand` gets autocomplete from your `@theme` block

### 2. Migrate the Login/Register mockups to React components

Build `LoginForm` and `RegisterForm` in `src/components/` using your chosen approach. Same fields as the HTML mockups from Lesson 01 (email, password, name, confirm password) — but as real React components with **controlled inputs** (`value` + `onChange` per field). Lesson 04 covers controlled inputs in detail; for now, manual `useState` per field is fine.

**Verify §2:**
- [ ] Both forms render in `<App />` without console warnings
- [ ] Typing into inputs updates state (visible if you `console.log`)
- [ ] `:focus-visible` outline shows when tabbing through inputs (don't disable it)
- [ ] Submit button has hover effect and is disabled when fields are empty

### 3. Build a `RoomCard` and a responsive `RoomList`

`RoomCard` props: `name`, `code` (mono font), `memberCount`, `status: 'pending' | 'drawn' | 'closed'`, `onOpen`. Status badge gets a different color per status.

`RoomList` — grid of `RoomCard`s using the modern default:

```css
/* CSS Modules */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  padding: clamp(1rem, 4vw, 3rem);
}
```

```tsx
// Tailwind
<div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] p-6">
```

**Container queries inside the card** — when the card is wider than ~360px, lay name + code + button side-by-side; otherwise stack vertically.

```css
/* CSS Modules — card.module.css */
.card { container-type: inline-size; }   /* mark the card as a query container */
.cardBody { display: flex; flex-direction: column; gap: var(--space-2); }

@container (min-width: 22rem) {
  .cardBody { flex-direction: row; align-items: center; }
}
```

```tsx
// Tailwind — wrap card in @container, use @container variants on children
<article className="@container rounded-lg bg-white shadow-sm p-5">
  <div className="flex flex-col @sm:flex-row gap-3">
    {/* name + code stack on narrow cards, sit in a row on wide cards */}
  </div>
</article>
```

> Why container queries here, not media queries? The same `RoomCard` will later live in two places: the wide rooms grid (3+ columns) and a narrow sidebar widget (full-width but only 240px). Media queries can only react to the viewport — the card-in-sidebar case stays "wide" by viewport definition. Container queries flip layout based on the **card's own width**.

**Verify §3:**
- [ ] Resize browser from 1400px down to 360px — the column count adapts smoothly without media queries (you should see 5+ → 4 → 3 → 2 → 1 columns)
- [ ] Drop one `RoomCard` into a narrow sidebar (any 280px-wide container) — its content stacks vertically; in the main grid, content is side-by-side
- [ ] Hover a card — it lifts slightly with a transition (use what you learned in L02)
- [ ] Tab to "Open" buttons — focus outline visible

### 4. Add a basic theme switch

Extend the §1 setup with dark-mode overrides. Don't build a toggle UI — Lesson 05 (App Task) wires that up.

**Path A — CSS Modules:** the `[data-theme="dark"]` block in `src/index.css` from §1 already does the override.

**Path B — Tailwind v4:** add a `@layer base` override:
```css
@layer base {
  [data-theme="dark"] {
    --color-bg: #1a1a1a;
    --color-text: #f0f0f0;
  }
}
```

**Verify §4:**
- [ ] Open DevTools → Elements → `<html>` → add attribute `data-theme="dark"`. Page background and text colors flip.
- [ ] Remove the attribute — light mode comes back.
- [ ] Cards, inputs, buttons all use variables (no hardcoded `#fff` or `#333` snuck in).
- [ ] No `console` errors or warnings.
