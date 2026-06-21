# Mockup ↔ App Alignment Plan

The app is now fully built and is the **visual source of truth**. The Figma
mockups predate several changes, so this doc captures every Figma edit needed to
bring the frames in line with the running app — applied **in one batch** the next
time the Figma MCP quota is free (the file sits in a team with a small per-team
MCP call limit; reads count too).

Every edit must be **tokenized** — bind fills to `Santa` variables and apply the
named text styles, never raw hex/px. (See the design-system doc and the
`figma-mockups-must-be-tokenized` rule.)

File: `vzwQuXGRqBQNUzpMlHtbvR` · authenticated as `vladka@checkpoint.com`.

---

## Tokens reference (`Santa` collection)

| Variable | ID | Variable | ID |
|----------|----|----------|----|
| color/background | `1:3` | color/card | `1:9` |
| color/foreground | `1:4` | color/muted | `1:10` |
| color/primary | `1:5` | color/muted-fg | `1:11` |
| color/primary-fg | `1:6` | color/border | `1:12` |
| color/secondary | `1:7` | color/destructive | `1:13` |
| color/accent | `1:8` | color/primary-soft | `21:2` |
| | | color/green-soft | `21:3` |

Text styles: `Display/Hero|Title|Section` + `Heading/Card|CardSm|Dialog` (Fraunces),
`Body`, `Body/Small`, `Body/Large`, `Label`, `Label/Small`, `Button`,
`Button/Small`, `Caption`, `Brand/Wordmark`, `Mono/Code`.

Icons: **lucide**, stroke ~1.8–2, **16–20px** for nav/inline, **24–40px** for
feature / empty-state marks.

---

## Per-screen icon inventory (app = source of truth)

The user's note — *"мокапи не мають іконок для кожної сторінки"* — is the core
gap. Below is exactly which icons the app renders on each screen, so the Figma
frames can be brought to match.

| Screen | Mobile / Desktop | Icons the app renders |
|--------|------------------|------------------------|
| Landing | `37-27` / `42-35` | `Gift` (hero badge) |
| Login | `2-2` / `9-2` | `Gift` (badge, size-8) — **see divergence #3** |
| Register | `37-2` / `42-2` | `Gift` (badge) |
| Rooms (dashboard) | `4-2` / `10-2` | `Gift` (logo + empty-state), `Plus` (Create), `Users` (participant count) |
| Room detail | `33-2` / `43-2` | `Dices` (Draw), `Gift` (Your-giftee card), `MessageCircle` (Messages link), `RefreshCw` (regenerate invite), `Trash2` (Delete room), `UserMinus` (Kick) |
| Messages | `34-2` / `44-2` | picker: `MessageCircle`, `ChevronRight` · chat: `ArrowLeft` (back), `Gift` (giftee tab), `Sparkles` (Santa tab), `Send` — **+ toggle, edit #1** |
| Notifications | `36-2` / `45-2` | `Bell` (empty-state) |
| Profile | `36-41` / `45-54` | none in-content (name + email card + Sign out button) |

**Navigation (every signed-in screen)** — sidebar on `md+`, bottom tab-bar below
(`navItems.ts`): `Gift`→Rooms, `Bell`→Notifications, `MessageCircle`→Messages,
`User`→Profile. The sidebar also has a `Gift` wordmark logo and a `LogOut` action.
Each mockup's nav must show these four icons with labels.

---

## Edit #1 — Messages two-chat toggle (PRIMARY) · `34:2` + `44:2`

The mockup shows only the anonymous "Your Santa" chat. The app now has **two
named chats** with a segmented toggle: `🎁 <giftee name>` and `✨ Your Secret
Santa`. Add a tokenized segmented control under the TopBar and shift the chat
area down. Active tab = the Santa thread (matches the existing bubbles/header).

Tokenized recipe (mobile `34:2`; redo for desktop `44:2` with its node ids):

```js
// active fill → color/primary (1:5), active text → color/primary-fg (1:6)
// track → color/muted (1:10), inactive text → color/muted-fg (1:11)
// active label style → Button/Small (Inter Semi Bold 13)
// inactive label style → Label/Small (Inter Medium 13)
const track = figma.createAutoLayout('HORIZONTAL', { name:'ChatSwitcher', itemSpacing:4 });
root.appendChild(track);                 // root = getNodeByIdAsync('34:2')
track.resize(358, 40);
track.primaryAxisSizingMode = 'FIXED';
track.counterAxisSizingMode = 'FIXED';
track.paddingLeft = track.paddingRight = track.paddingTop = track.paddingBottom = 4;
track.cornerRadius = 12;
track.fills = [bind(muted)];             // bind() = setBoundVariableForPaint
track.x = 16; track.y = 83;
// two pills (FILL width): 🎁 Bob (inactive, transparent) | ✨ Your Santa (active, primary)
// then: messages frame (34:8) → y = 135, height = 654
```

Checklist: `[ ] 34:2 toggle` · `[ ] 44:2 toggle`.

## Edit #2 — Per-page icons in nav + headers

For each frame, make sure the **bottom-nav / sidebar** shows the four nav icons
(Gift / Bell / MessageCircle / User) with labels, and that **section headers and
action buttons** carry the in-page icons from the inventory table (e.g. Rooms
"Create" button → `Plus`; Room-detail "Draw names" → `Dices`; Notifications
empty-state → `Bell`). Draw each as a lucide vector, tokenized stroke colour
(`color/foreground` or `color/muted-fg` for inactive nav).

Checklist per frame: `[ ] Landing [ ] Login [ ] Register [ ] Rooms [ ] RoomDetail [ ] Messages [ ] Notifications [ ] Profile`.

## Edit #3 — Brand badge: Gift vs Santa-hat (DECISION NEEDED)

The mockups use the **Santa-hat** badge + scattered **snowflakes**; the built app
renders the `Gift` lucide icon and does **not** use `santa-hat.svg` /
`snowflake.svg` (only the `--frost` token is referenced). Pick one direction —
not auto-applied:

- **(A, recommended)** App adopts the shipped hat: render `/decor/santa-hat.svg`
  on the Login/Register/Landing/Rooms badge and scatter `snowflake.svg` on Rooms.
  The assets already ship in `public/decor/`, so this only *uses* what candidates
  already have — and the app then matches the richer mockup.
- **(B)** Swap the mockup hat → `Gift` and drop the snowflakes, matching the
  current app exactly.

---

## Assets availability (candidate) — ✅ already covered

Everything a candidate needs to build these screens ships in the template:

- **Decor SVGs**: `public/decor/santa-hat.svg`, `snowflake.svg`, plus `favicon.svg`
  (`public/decor/README.md` documents usage).
- **Icons**: `lucide-react` is a dependency — every icon in the inventory above is
  available by import; the route→icon map lives in `src/components/layout/navItems.ts`.
- **Design values**: `docs/design-system.md` + `docs/design-tokens.json`.
- **Mockups**: the Figma file is open-by-link.

No missing assets — the only outstanding work is the Figma **frame** edits above
(visual parity), which don't require any new candidate-facing asset.

---

## Apply when MCP quota resets

1. Edit #1 — `34:2` then `44:2` (one `use_figma` each, no re-inspection needed —
   node ids + tokens are captured here).
2. Edit #2 — nav + header icons per frame.
3. Resolve Edit #3 with the user, then apply A or B.
4. `get_screenshot` 1–2 frames to verify; refresh `preview.png` if the cover changed.
