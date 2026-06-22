# Secret Santa — Design

The single, repo-root home for the project's **design** — kept here (not inside
`santa-app/`) so it reads as design reference, not app code. Everything a
candidate needs to understand and build the UI lives in this folder.

## What's here

| Path | What it is |
|------|------------|
| [`design-system.md`](design-system.md) | The design system — palette, type ramp, spacing, component specs, layout/responsive rules. **Start here.** |
| [`design-tokens.json`](design-tokens.json) | The raw tokens (colors as hex + HSL, text styles, radii) — exact values to transfer into code. |
| [`screens/`](screens/) | **All screens, captured from the live app** — `mobile/` (390×844) and `desktop/` (1440×900). The accurate, current look of every page. |
| [`figma-import/`](figma-import/) | Editable SVG assets to drag into Figma (the Messages two-chat toggle, etc.) + import notes. |
| [`ALIGNMENT.md`](ALIGNMENT.md) | App↔mockup alignment plan: per-screen icon inventory and the Figma edits that bring the canonical Figma file in line with the app. |
| [`preview.png`](preview.png) | A single cover image. |

## Screens

Eight screens, each at mobile + desktop. These are real renders of the running
app, so they reflect every current design decision (Santa-hat brand badge,
snowflake decor, the Messages giftee / Secret-Santa two-chat toggle, etc.).

| Screen | Mobile | Desktop |
|--------|--------|---------|
| Landing | `screens/mobile/landing.png` | `screens/desktop/landing.png` |
| Login | `screens/mobile/login.png` | `screens/desktop/login.png` |
| Register | `screens/mobile/register.png` | `screens/desktop/register.png` |
| Rooms | `screens/mobile/rooms.png` | `screens/desktop/rooms.png` |
| Room detail | `screens/mobile/room-detail.png` | `screens/desktop/room-detail.png` |
| Messages | `screens/mobile/messages.png` | `screens/desktop/messages.png` |
| Notifications | `screens/mobile/notifications.png` | `screens/desktop/notifications.png` |
| Profile | `screens/mobile/profile.png` | `screens/desktop/profile.png` |

## Figma

The canonical editable mockups also live in Figma (open by link):
**[Secret Santa — Mockups](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups)**.
To stand up a **fresh** Figma project from these exact screens, create a new file
and drag the PNGs from `screens/` straight onto the canvas (one frame per image);
for editable vector pieces use the SVGs in `figma-import/`.

## Regenerating the screens

The screens are screenshots of the running app at both viewports, taken against a
seeded drawn room (users, wishlists, messages, notifications). Re-run the capture
after UI changes so this folder stays the source of truth.
