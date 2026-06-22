# Local mockup copy — captured from the live app

These are the **current, app-accurate** screens, rendered straight from the running
santa-app at two sizes. Because the app is now the source of truth, these match it
exactly — including the Santa-hat brand badge, the snowflake decor, and the
Messages **two-chat toggle** (giftee / Secret Santa).

- `mobile/`  — 390 × 844 (full page)
- `desktop/` — 1440 × 900 (full page)

| Screen | File | Notes |
|--------|------|-------|
| Landing | `landing.png` | hat hero, logged-out |
| Login | `login.png` | hat badge in primary-soft circle |
| Register | `register.png` | hat badge |
| Rooms | `rooms.png` | sidebar hat logo + nav, snowflake decor, drawn room card |
| Room detail | `room-detail.png` | participants, invite, wishlist, giftee card + Messages link |
| Messages | `messages.png` | **two-chat toggle**, two-tone bubbles, composer |
| Notifications | `notifications.png` | bell list |
| Profile | `profile.png` | name + email card, sign out |

Regenerate after UI changes by screenshotting the routes at both viewports with a
seeded drawn room (see the seeding + Playwright steps used to create these).

> For **editable Figma import**, use the SVGs in `../figma-import/` (the toggle is
> there; ask for full-frame or icon SVGs if needed). These PNGs are visual
> reference / underlay.
