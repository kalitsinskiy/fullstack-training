# Figma import — Messages alignment

Import-ready assets to bring the **Messages** mockup in line with the app, without
the Figma MCP (which is rate-limited on this file's Starter team). Drag the SVG
straight onto the canvas — Figma turns it into editable shape + text layers.

## `messages-toggle.svg` — the two-chat switcher

The one thing missing from the mockup: a segmented switch between your **giftee**
chat and your anonymous **Secret Santa** chat.

**Place it:**
1. Drag `messages-toggle.svg` into the file.
2. Drop a copy into **frame `34:2` (Messages – Mobile)** at **x = 16, y = 83**
   (just under the TopBar).
3. Select the existing **`Messages`** group (the chat bubbles) and move it **down
   ~64px** (e.g. y 71 → 135) so the toggle has room.
4. Repeat for the desktop frame **`44:2`** — same toggle, resize its **width** to
   match the desktop chat column (keep height 40), and nudge the chat list down.

**Re-tokenize after import** (Figma import bakes raw hex — rebind to the `Santa`
variables and text styles, per `figma-mockups-must-be-tokenized`):

| Layer | Raw value in SVG | Bind to |
|-------|------------------|---------|
| Track rect fill | `#EFEAE0` | `color/muted` |
| Active pill fill | `#C2410C` | `color/primary` |
| "✨ Your Santa" text | `#FFFCF0`, Inter 600 | `color/primary-fg` + text style **Button/Small** |
| "🎁 Bob" text | `#8A7A6A`, Inter 500 | `color/muted-fg` + text style **Label/Small** |

Active tab = **Your Santa** (matches the bubbles already shown). The giftee tab
label `Bob` is a placeholder — it's the giftee's display name at runtime.

## Per-screen icons (optional, Edit #2)

The nav/section icons the app uses are plain [lucide](https://lucide.dev) icons —
grab any as SVG from lucide.dev and drop in (names per `../ALIGNMENT.md`): nav =
Gift / Bell / MessageCircle / User; Rooms = Plus, Users; Room detail = Dices,
RefreshCw, Trash2, UserMinus; Messages chat = ArrowLeft, Send, Sparkles, Gift.

> Want the whole updated frame as one importable SVG instead of just the toggle,
> or the icon set pre-exported? Say so and I'll generate them here too.
