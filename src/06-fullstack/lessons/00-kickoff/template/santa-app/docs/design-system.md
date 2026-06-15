# Secret Santa — Design System

The single source of truth for the look & feel of `santa-app`.
Tokens live as CSS variables in [`src/index.css`](../src/index.css) and are
mapped to Tailwind utilities in [`tailwind.config.ts`](../tailwind.config.ts).

> **Origin.** Adapted from Figma community references (a mobile "Gift app" for
> screen structure, a "Christmas Landing" for the marketing page and decor).
> The palette was re-themed to a warm Santa scheme; don't expect a 1:1 match
> with the original files.

---

## 0. Reading styles — you do NOT need Figma Dev Mode

Figma **Dev Mode** (the panel that auto-generates CSS and lets you measure) is a
**paid** feature. You don't need it: **this document is the source of truth for
every value** — exact colors, fonts, sizes, spacing, radii — and they're already
in code (`src/index.css`, `tailwind.config.ts`). So:

- **No Dev Mode?** Use this file + `src/index.css` for the numbers, and the
  [Figma file](mockups/) for the layout (open by link — see `mockups/README.md`).
  That's everything you need. Even on a **free** Figma account you can still open
  the file and click a layer — the right-hand **Design** panel shows its fill,
  font, size, and radius (read-only); Dev Mode only adds the CSS-snippet/measure
  convenience on top.
- **Have Dev Mode?** Great — select any element to read its bound token and the
  generated CSS directly. It'll match the tables below (Figma's `Santa` variable
  collection ↔ the CSS variables here).

**Live design (open by link):**
[Secret Santa — Mockups (Figma)](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups)
— view access is open, just click. Canonical for layout; this doc is canonical
for exact values.

Either way the chain is: **mockup PNG → this doc (values) → `index.css` /
`tailwind.config.ts` (ready-made classes) → `LoginPage.tsx` (worked example).**

> Prefer machine-readable? Every value here is also in
> [`design-tokens.json`](design-tokens.json) (colors with hex+HSL, the type
> ramp, radii, breakpoints, component sizes).

---

## 1. Brand

**Personality:** warm, festive, friendly — but still a clean product UI, not a
novelty Christmas page. Cream surfaces instead of stark white, a confident red
primary, pine-green for success, gold for small accents.

---

## 2. Color tokens

Defined as HSL channels (no `hsl()` wrapper) so Tailwind can apply opacity
modifiers like `bg-primary/90`.

| Token | HSL | Hex | Tailwind class | Use |
|-------|-----|-----|----------------|-----|
| `--background` | `48 100% 96%` | `#FFFBEB` | `bg-background` | App background (cream) |
| `--foreground` | `22 78% 27%` | `#78350F` | `text-foreground` | Body text (cocoa) |
| `--primary` | `17 88% 40%` | `#C2410C` | `bg-primary` | Primary actions, brand |
| `--primary-foreground` | `48 100% 97%` | `#FFFCF0` | `text-primary-foreground` | Text on primary |
| `--secondary` | `142 72% 29%` | `#15803D` | `bg-secondary` | Success, pine-green |
| `--accent` | `41 96% 40%` | `#CA8A04` | `bg-accent` | Highlights, gold |
| `--destructive` | `0 72% 45%` | `#C62828` | `bg-destructive` | Errors, danger |
| `--muted` | `40 30% 92%` | `#EFEAE0` | `bg-muted` | Subtle backgrounds |
| `--muted-foreground` | `25 20% 45%` | `#8A7A6A` | `text-muted-foreground` | Secondary text |
| `--border` | `40 25% 86%` | `#E3DBCF` | `border-border` | Borders, dividers |
| `--card` | `0 0% 100%` | `#FFFFFF` | `bg-card` | Cards, inputs (true white pops on cream) |
| `--primary-soft` | `24 64% 91%` | `#F7E6DB` | `bg-primary-soft` | Hat badge, avatar circles, soft fills |
| `--green-soft` | `136 33% 89%` | `#DBEDE0` | `bg-green-soft` | "drawn" status pill background |
| `--frost` | `198 30% 74%` | `#A9C5D1` | `text-frost` | Decorative snowflakes only (Rooms) |

**Usage rules**
- Primary red = the one main CTA per view. Don't fill a screen with red.
- Pine-green = positive/confirmed states (drawn, joined, success toast).
- Gold = tiny accents only (badge, icon highlight) — never large fills.
- Body copy uses `foreground` (cocoa), not pure black — keeps the warm feel.

**Dark mode:** not in the baseline. `darkMode: ['class']` is wired in Tailwind,
so a `.dark` token block can be added later as a bonus.

---

## 3. Typography

Loaded from Google Fonts in [`index.html`](../index.html).

| Role | Font | Tailwind | Notes |
|------|------|----------|-------|
| Display / headings | **Fraunces** | `font-display` | Serif with character; `h1–h3` use it automatically |
| UI / body | **Inter** | `font-sans` (default) | Everything else |
| Invite codes / mono | **JetBrains Mono** | `font-mono` | Room invite codes, anything monospaced |

**Type ramp** — the exact named styles used in the Figma mockups (`Santa` text
styles). Sizes are in px with a Tailwind hint (use an arbitrary value like
`text-[15px]` where the default scale has no exact match).

| Figma style | Font / weight | Size | Line-height | Tailwind hint | Use |
|-------------|---------------|------|-------------|---------------|-----|
| `Display/Hero` | Fraunces Bold | 56 | 110% | `font-display text-[56px] font-bold leading-[1.1]` | Landing hero |
| `Display/Title` | Fraunces SemiBold | 32 | 120% | `font-display text-[32px] font-semibold` | Desktop page title |
| `Heading/Dialog` | Fraunces SemiBold | 28 | 120% | `font-display text-[28px] font-semibold` | Auth card title (desktop) |
| `Display/Section` | Fraunces SemiBold | 24 | 120% | `font-display text-2xl font-semibold` | Mobile page title |
| `Heading/Card` | Fraunces SemiBold | 19 | 130% | `font-display text-[19px] font-semibold` | Card title (desktop) |
| `Heading/CardSm` | Fraunces SemiBold | 17 | 130% | `font-display text-[17px] font-semibold` | Card title (mobile) |
| `Brand/Wordmark` | Fraunces Bold | 17 | 120% | `font-display text-[17px] font-bold` | "Secret Santa" logo |
| `Body/Large` | Inter Regular | 18 | 150% | `text-lg` | Hero subtitle |
| `Body` | Inter Regular | 15 | 150% | `text-[15px]` | Default body (desktop) |
| `Body/Small` | Inter Regular | 13 | 150% | `text-[13px]` | Body / subtitles (mobile) |
| `Label` | Inter Medium | 14 | 140% | `text-sm font-medium` | Form labels (desktop) |
| `Label/Small` | Inter Medium | 13 | 140% | `text-[13px] font-medium` | Form labels (mobile) |
| `Caption` | Inter Medium | 12 | 130% | `text-xs font-medium` | Pills, nav labels, meta |
| `Button` | Inter Semi&nbsp;Bold | 15 | 100% | `text-[15px] font-semibold` | Button label (desktop) |
| `Button/Small` | Inter Semi&nbsp;Bold | 13 | 100% | `text-[13px] font-semibold` | Button label (mobile) |
| `Mono/Code` | JetBrains Mono Medium | 12 | 120% | `font-mono text-xs font-medium` | Invite codes |

---

## 4. Spacing, radii, shadows

- **Spacing:** Tailwind 4px base scale (`p-2`=8px, `p-4`=16px, `p-6`=24px). Cards use `p-6`; page gutters use the `container` (`px-4`, centered, max `2xl`=1280px).
- **Radii:** `--radius: 0.75rem` (12px). `rounded-lg`=12px (cards), `rounded-md`=10px (inputs/buttons), `rounded-sm`=8px, `rounded-full` (chips/avatars).
- **Shadows:** `shadow-sm` (cards at rest), `shadow` (primary button), `shadow-lg` (toasts, popovers/modals). Keep elevation subtle.

---

## 5. Components (shadcn/ui)

Already in the baseline (`src/components/ui/`):

| Component | File | Variants |
|-----------|------|----------|
| Button | `button.tsx` | `default` `secondary` `outline` `ghost` `destructive` `link` × `sm` `default` `lg` `icon` |
| Input | `input.tsx` | — |
| Label | `label.tsx` | — |
| Card | `card.tsx` | Header/Title/Description/Content/Footer |
| Toaster | `sonner.tsx` | `toast.success` / `toast.error` |

App-level helpers: `PageHeader`, `EmptyState`, `AppLayout`, `Sidebar`, `BottomNav`.

**Exact specs** (as built in the mockups — so you don't need to measure):

| Element | Size / spec |
|---------|-------------|
| Button | height **44** (mobile) / **48** (desktop); radius `8`; `px` 16–26; label = `Button` style; `sm` height 36, `icon` 40×40 |
| Input | height **40** (mobile) / **44** (desktop); radius `8`; 1px `border`; `px` 12–14; placeholder = `muted-foreground` |
| Card | radius **12** (mobile) / **14–16** (desktop); padding **24** (`p-6`); 1px `border`; `shadow-sm` |
| Pill / Badge | radius `full`; `px` 10, `py` 4; text = `Caption` (12, Medium); status: pending = `muted`/`muted-foreground`, drawn = `green-soft`/`secondary` |
| Invite-code pill | same pill, text = `Mono/Code`; bg `muted`, text `foreground` |
| Avatar / chip circle | **26** (chip) / **52–56** (profile); fill `primary-soft` |
| Hat badge | **60–64** circle, fill `primary-soft`, Santa-hat icon centered |
| Sidebar (desktop) | width **260**; `bg-card`; 1px right border; logo + nav + user block |
| Bottom nav (mobile) | height **64**; `bg-card`; 1px top border; 4 tabs, active = `primary` |
| Icons | `lucide-react`, stroke ~1.8–2, 16–20px (nav/inline), 24–40px (feature/empty-state) |

**Add more shadcn components as features need them:**

```bash
npx shadcn@latest add dialog avatar badge dropdown-menu skeleton tabs
```

Likely additions per lesson:
- **Dialog** — create-room / join-room modals (fullstack 03/04)
- **Avatar + Badge** — participant chips (fullstack 03)
- **Skeleton** — loading states with TanStack Query (fullstack 03+)
- **Tabs** — room detail (participants / wishlist / messages)

---

## 6. Layout & responsive

Mobile-first. Breakpoints are Tailwind defaults:

| Prefix | Min width | Layout shift |
|--------|-----------|--------------|
| (base) | 0 | Mobile: bottom tab bar, single column |
| `md` | 768px | Sidebar replaces bottom nav; 2-column grids |
| `lg` | 1024px | Wider content, multi-column dashboards |
| `2xl` | 1280px | `container` max width |

- **Navigation:** `Sidebar` (desktop, `hidden md:flex`) + `BottomNav` (mobile, `md:hidden`). Both read the same `navItems.ts`.
- **Content width:** `container max-w-4xl` keeps reading line-length comfortable.
- The Figma "Gift app" frames (375px) are the mobile reference; desktop is sidebar + main content.

---

## 7. Screen wireframes

> **High-fidelity mockups:** see [`mockups/`](mockups/) for the Figma-exported
> Login and Rooms screens (mobile + desktop) you build against. The ASCII
> sketches below are a quick structural reference; the mockups are the spec.


```
LANDING (/)  — public
┌──────────────────────────────────────────┐
│ 🎁 Secret Santa            [Sign in][Get…] │
├──────────────────────────────────────────┤
│  Gift-giving, made magical.   ┌─────────┐  │
│  <subhead copy>               │  decor  │  │
│  [Start a room][I have invite]│  art    │  │
│                               └─────────┘  │
│  ┌──Create──┐ ┌──Draw──┐ ┌──Wishes──┐      │
│  │ feature  │ │ feature│ │ feature  │      │
│  └──────────┘ └────────┘ └──────────┘      │
└──────────────────────────────────────────┘

AUTH (/login, /register)
┌──────────────────────┐
│        🎁            │
│   Welcome back       │
│  [email          ]   │
│  [password       ]   │
│  [   Sign in     ]   │
│  No account? Create  │
└──────────────────────┘

APP SHELL (authenticated)
┌────────┬─────────────────────────────┐
│ 🎁 Logo│  Page title        [action] │
│        │                             │
│ ▸Rooms │   ┌─────────────────────┐   │
│  Alerts│   │  page content       │   │   desktop: sidebar left
│  Msgs  │   │                     │   │   mobile : bottom tab bar
│  Profil│   └─────────────────────┘   │
│        │                             │
│ user ⏻ │                             │
└────────┴─────────────────────────────┘

ROOM DETAIL (/rooms/:id)
┌─────────────────────────────────────┐
│ Room name              code: A1B2C3  │
├──────────────────┬──────────────────┤
│ Participants      │ Your wishlist    │
│ ◯ Alice  ◯ Bob    │ • item           │
│ ◯ You             │ • item   [+ add] │
│                   │ [ Draw names ]   │
└──────────────────┴──────────────────┘
```

---

## 8. Decor assets

The brand SVGs **ship in the repo** at [`public/decor/`](../public/decor/) —
no need to re-export from Figma:

- `santa-hat.svg` — hat mark (red `--primary` cone + white brim/pompom). Login/
  Register badge, Landing hero, the Rooms logo.
- `snowflake.svg` — `--frost` snowflake; decorative scatter on Rooms.

Usage examples (incl. the hat-on-soft-circle badge) are in
[`public/decor/README.md`](../public/decor/README.md). Use them sparingly:
landing hero, the "Secret Santa" logo, a few low-opacity snowflakes, optional
empty-state / draw-complete flourishes.

Want richer 3D illustrations (Santa, tree, gifts)? Export from the Figma file as
SVG/PNG and add them here — keep each under ~150 KB, prefer SVG.
