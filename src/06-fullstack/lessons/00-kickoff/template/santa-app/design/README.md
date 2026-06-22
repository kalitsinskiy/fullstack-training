# Secret Santa — Design

Everything you need to build the UI lives **here**, next to the app. It's all
**local** — no Figma, no Dev Mode, no accounts. Start with `design-system.md`,
match the screens in `screens/`, use the exact values in `design-tokens.json`.

## What's here

| Path | What it is |
|------|------------|
| [`design-system.md`](design-system.md) | The design system — palette, type ramp, spacing, component specs, layout/responsive rules. **Start here.** |
| [`design-tokens.json`](design-tokens.json) | The raw tokens (colors as hex + HSL, text styles, radii) — exact values, already mirrored in `../src/index.css`. |
| [`screens/`](screens/) | **All 8 screens** as PNGs, `mobile/` (390×844) and `desktop/` (1440×900) — the accurate, current look of every page. |
| [`preview.png`](preview.png) | A single cover image. |

## Screens (build to these)

Real renders of the running app, so they show every current decision (Santa-hat
brand badge, snowflake decor, the Messages giftee / Secret-Santa two-chat toggle).

| Screen | Mobile | Desktop | Route |
|--------|--------|---------|-------|
| Landing | `screens/mobile/landing.png` | `screens/desktop/landing.png` | `/` |
| Login | `screens/mobile/login.png` | `screens/desktop/login.png` | `/login` |
| Register | `screens/mobile/register.png` | `screens/desktop/register.png` | `/register` |
| Rooms | `screens/mobile/rooms.png` | `screens/desktop/rooms.png` | `/rooms` |
| Room detail | `screens/mobile/room-detail.png` | `screens/desktop/room-detail.png` | `/rooms/:id` |
| Messages | `screens/mobile/messages.png` | `screens/desktop/messages.png` | `/rooms/:id/messages` |
| Notifications | `screens/mobile/notifications.png` | `screens/desktop/notifications.png` | `/notifications` |
| Profile | `screens/mobile/profile.png` | `screens/desktop/profile.png` | `/profile` |

## Fonts

Loaded once via Google Fonts in [`../index.html`](../index.html); use the Tailwind
families (configured in `../tailwind.config.ts`):

| Use | Font | Tailwind class |
|-----|------|----------------|
| Display / headings | **Fraunces** (serif) | `font-display` |
| UI / body | **Inter** | `font-sans` (default) |
| Code / invite codes | **JetBrains Mono** | `font-mono` |

Exact sizes/weights per style (Display/Hero, Heading/Card, Body, Button, …) are in
`design-system.md` and `design-tokens.json`.

## Icons

All icons are [**lucide-react**](https://lucide.dev) (already a dependency) — import
by name, no SVG files needed. The route → nav-icon map lives in
`../src/components/layout/navItems.ts`:

| Where | Icons |
|-------|-------|
| Bottom nav / sidebar | `Gift` (Rooms) · `Bell` (Notifications) · `MessageCircle` (Messages) · `User` (Profile) |
| Rooms | `Plus` (create), `Users` (participant count) |
| Room detail | `Dices` (draw), `Gift` (giftee), `RefreshCw` (regenerate code), `Trash2` (delete), `UserMinus` (kick) |
| Messages | `ArrowLeft` (back), `Gift` / `Sparkles` (chat tabs), `Send` |
| Notifications | `Bell` |

The brand badge (Login/Register/Landing/sidebar logo) is **not** a lucide icon —
it's `../public/decor/santa-hat.svg` (+ `snowflake.svg` decor on Rooms). See
`../public/decor/README.md`. The full route → nav-icon map is in
[`../src/components/layout/navItems.ts`](../src/components/layout/navItems.ts).

## Regenerating the screens

The PNGs are screenshots of the running app at both viewports, taken against a
seeded drawn room (users, wishlists, messages, notifications). Re-run the capture
after UI changes so this folder stays the source of truth.
