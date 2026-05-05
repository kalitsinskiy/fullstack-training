# CSS Essentials & Responsive Design

## Quick Overview

CSS (Cascading Style Sheets) controls how HTML elements **look** — colors, sizes, spacing, layout. The browser matches your CSS rules to HTML elements via **selectors** and applies the declared **properties**. This lesson is the working subset every frontend developer needs: cascade, specificity, box model, Flexbox, Grid, units (rem/em/px/vw/vh), centering — and **mobile-first responsive design** so the same UI works on a 360px phone and a 4K monitor.

> Lesson 03 covers how to use this in React (CSS Modules, Tailwind, Styled Components). This lesson is the language itself.

## Key Concepts

### How CSS Works

A CSS rule has three parts:

```css
selector {
  property: value;
}
```

```css
/* Select all <p> elements and make them dark gray with spacing */
p {
  color: #333;
  margin-bottom: 1rem;
}
```

Three ways to add CSS (in order of preference):

1. **External stylesheet** (best) — `<link rel="stylesheet" href="styles.css">`
2. **`<style>` block** in `<head>` — fine for examples, avoid in production
3. **Inline styles** — `<p style="color: red;">` — avoid; hard to maintain

### Cascade and Specificity

When multiple rules target the same element, the browser decides which wins using **specificity**:

```
Inline styles    →  1,0,0,0    (highest)
#id selectors    →  0,1,0,0
.class selectors →  0,0,1,0
tag selectors    →  0,0,0,1    (lowest)
```

Examples:

```css
p { color: black; }                /* specificity: 0,0,0,1 */
.intro { color: blue; }           /* specificity: 0,0,1,0 — wins over p */
#hero { color: green; }           /* specificity: 0,1,0,0 — wins over .intro */
p.intro { color: red; }           /* specificity: 0,0,1,1 — wins over .intro alone */
```

Rules at the **same specificity**: the last one in the source wins.

`!important` overrides everything — avoid it. If you need it, your selectors are too complex.

### Inheritance

Some properties are inherited from parent to child (mostly text-related):
- **Inherited**: `color`, `font-family`, `font-size`, `line-height`, `text-align`
- **Not inherited**: `margin`, `padding`, `border`, `background`, `display`, `width`, `height`

```css
body {
  font-family: system-ui, sans-serif;  /* all children inherit this */
  color: #333;                          /* most text inherits this color */
}
```

> **Form controls don't inherit fully.** `<input>`, `<button>`, `<select>`, `<textarea>` have user-agent styles that override inheritance — set their `font` and `color` explicitly (or use `font: inherit; color: inherit;` in your reset).

### Box Model

Every element is a box with four layers:

```
┌─────────────── margin ───────────────┐
│  ┌─────────── border ──────────────┐ │
│  │  ┌──────── padding ──────────┐  │ │
│  │  │                           │  │ │
│  │  │        content            │  │ │
│  │  │    (width x height)       │  │ │
│  │  │                           │  │ │
│  │  └───────────────────────────┘  │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Critical:** By default, `width` only sets the content width. Padding and border are added on top:

```css
/* Default: box-sizing: content-box */
.box { width: 200px; padding: 20px; border: 2px solid; }
/*
   Rendered width = content + padding-left + padding-right + border-left + border-right
                  = 200       + 20           + 20            + 2            + 2
                  = 244px      ← surprise!
*/

/* Fix: box-sizing: border-box — width INCLUDES padding and border */
.box { width: 200px; padding: 20px; border: 2px solid; box-sizing: border-box; }
/* Rendered width: 200px  (padding + border are subtracted from content area) */
```

Always use this reset at the top of your CSS:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### Display

`display` decides **what kind of box** an element generates and **how its children are laid out**.

```css
display: block;        /* full-width box, starts on a new line (div, p, h1) */
display: inline;       /* flows with text, ignores width/height (span, a, strong) */
display: inline-block; /* sits inline like text, but respects width/height/padding */
display: none;         /* removed from layout AND accessibility tree */
display: flex;         /* turns this element into a flex container — see Flexbox section */
display: grid;         /* turns this element into a grid container — see Grid section */
display: contents;     /* element disappears as a box, but children stay in flow (rare, advanced) */
```

**`inline-block` use case** — buttons in a paragraph of text, badges next to a heading. You want it to flow with text but to respect `padding: 8px 16px`. Don't use it for layout — flex/grid are the modern answer.

**`display: none` vs `visibility: hidden`** — `none` removes the element entirely (taking no space); `visibility: hidden` keeps the space but hides the visual. Use `none` 95% of the time.

### Positioning

```css
position: static;    /* default — normal document flow, top/left/etc are IGNORED */
position: relative;  /* offset from normal position via top/right/bottom/left — still takes its old space */
position: absolute;  /* removed from flow; positioned relative to nearest positioned ancestor */
position: fixed;     /* removed from flow; positioned relative to the viewport (stays on scroll) */
position: sticky;    /* normal flow until scroll threshold, then "sticks" to that offset */
```

**`top` / `right` / `bottom` / `left` only work when `position` is something other than `static`.** They specify the distance from that edge of the **containing block** (the reference frame).

| `position` | What is the reference? | What `top: 0` does |
|---|---|---|
| `relative` | The element's own normal position | Shift the element 0 from where it would naturally sit (so: same place, but `absolute` children can now anchor to it) |
| `absolute` | Nearest **positioned ancestor** (or `<html>` if none) | Stick to the top edge of that ancestor |
| `fixed` | The viewport | Stick to the top edge of the screen |
| `sticky` | The nearest scroll container | When the element is about to scroll out, glue it `0` from the top of the scroll area |

**Common patterns:**

```css
/* "Badge" in the corner of a card */
.card { position: relative; }
.card .badge { position: absolute; top: 8px; right: 8px; }

/* Modal overlay covering the screen */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); }

/* Sticky table header — stays visible while scrolling the table body */
.table thead th { position: sticky; top: 0; background: white; z-index: 1; }

/* Sticky page header — stays at top of viewport on long pages */
.site-header { position: sticky; top: 0; z-index: 100; }
```

> `inset: 0` is shorthand for `top: 0; right: 0; bottom: 0; left: 0` — the element fills its containing block.

### Flexbox

Flexbox is a **one-dimensional** layout system — either a row or a column.

```css
/* Container properties */
.container {
  display: flex;
  flex-direction: row;           /* row (default) | column */
  justify-content: center;       /* main axis: flex-start | center | flex-end | space-between | space-around | space-evenly */
  align-items: center;           /* cross axis: flex-start | center | flex-end | stretch | baseline */
  gap: 1rem;                     /* space between items */
  flex-wrap: wrap;               /* allow items to wrap to next line */
}

/* Item properties */
.item {
  flex-grow: 1;     /* how much extra space this item absorbs (0 = don't grow) */
  flex-shrink: 0;   /* how much this item shrinks when space is tight (0 = don't shrink) */
  flex-basis: 200px; /* initial size before growing/shrinking */
  order: 2;         /* visual order (default 0) */
}

/* Shorthand */
.item { flex: 1; }            /* grow: 1, shrink: 1, basis: 0 */
.item { flex: 0 0 200px; }    /* fixed 200px, no grow, no shrink */
```

Common patterns:

```css
/* Center anything */
.center { display: flex; justify-content: center; align-items: center; }

/* Space items evenly in a navbar */
.navbar { display: flex; justify-content: space-between; align-items: center; }

/* Equal-width columns */
.columns { display: flex; gap: 1rem; }
.columns > * { flex: 1; }
```

### CSS Grid

Grid is a **two-dimensional** layout system — rows and columns at the same time.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 equal columns */
  grid-template-rows: auto;               /* rows size to content */
  gap: 1rem;                              /* space between cells */
}
```

Key concepts:

```css
/* Fixed + flexible columns */
grid-template-columns: 250px 1fr;         /* sidebar(250px) + main(rest) */

/* Repeat with minmax for responsive grids */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));

/* Place an item across multiple cells */
.item {
  grid-column: 1 / 3;  /* spans columns 1 and 2 */
  grid-row: 1 / 2;     /* just row 1 */
}

/* Named areas */
.layout {
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

**Flexbox vs Grid:**
- Use **Flexbox** for one-dimensional layouts (navbar, card row, centering)
- Use **Grid** for two-dimensional layouts (page layout, dashboards, galleries)
- They work well **together** — Grid for the page layout, Flexbox for components inside

### Units

```css
/* Absolute */
px       /* pixels — fixed size, most common for borders and small values */

/* Relative to font */
em       /* relative to PARENT's font-size (1.5em = 1.5x parent font). Compounds — beware nesting */
rem      /* relative to ROOT (<html>) font-size. PREFERRED for spacing and sizing — predictable */

/* Relative to viewport */
vh       /* 1% of viewport height */
vw       /* 1% of viewport width */

/* Modern viewport units (account for mobile browser chrome) */
svh, svw /* small viewport — when address bar is visible */
lvh, lvw /* large viewport — when address bar is hidden */
dvh, dvw /* dynamic viewport — auto-adjusts. Use this for full-screen layouts on mobile */

/* Percentage */
%        /* relative to parent's width (for width) or height (for height) */

/* Function units */
calc(100vh - 64px)              /* mix units */
clamp(1rem, 2.5vw, 1.5rem)      /* min, preferred, max — fluid sizing without media queries */
min(100%, 600px)                /* whichever is smaller */
max(50vw, 320px)                /* whichever is bigger */
```

**em vs rem — the practical difference:**

```css
html { font-size: 16px; }
.parent { font-size: 20px; }
.child {
  padding-left: 2em;    /* 40px (2 × parent's 20px) */
  margin-left: 2rem;    /* 32px (2 × root's 16px) — predictable everywhere */
}
```

Use `em` for things that should scale **with the local element** (e.g. button padding that scales with button text). Use `rem` for almost everything else — spacing, font-size, gaps — because it's not affected by parent font-size and stays consistent across the app.

**Rule of thumb:**
- `rem` — font sizes, padding, margins, gaps, border-radius (anything spacing-like)
- `px` — borders (1px, 2px) and shadow blur radius
- `%` or `fr` — layout widths inside a container
- `dvh` / `dvw` — full-viewport sections on mobile (instead of `100vh`, which jumps when the address bar shows/hides)
- `clamp()` — fluid values that scale with viewport but stay within sensible bounds (great for typography)

### Centering — the recipes

Centering used to be a meme. Now there are clean answers:

```css
/* Horizontal center of a fixed-width block */
.container { max-width: 1200px; margin-inline: auto; }

/* Center text */
.title { text-align: center; }

/* Center one item in both axes (FLEX) */
.center {
  display: flex;
  justify-content: center;   /* main axis */
  align-items: center;       /* cross axis */
  min-height: 100dvh;        /* fill viewport */
}

/* Center one item in both axes (GRID — shorter) */
.center { display: grid; place-items: center; min-height: 100dvh; }

/* Absolute centering (used for modals, overlays) */
.modal {
  position: fixed; inset: 0;
  display: grid; place-items: center;
}
```

### CSS Custom Properties (Variables)

Define a value once, reuse it everywhere — and override it for theming. CSS variables are **runtime** (unlike Sass `$vars` which are compile-time): you can change them with JS or media queries, and the page repaints with no rebuild.

```css
/* Define on :root (the <html> element) so they're inherited everywhere */
:root {
  --color-primary: #2d5a27;
  --color-danger:  #c0392b;
  --color-bg:      #ffffff;
  --color-text:    #333333;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --radius:  0.5rem;
}

/* Use with var() */
.button {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
}

/* Theme switch — override on a different selector. All children update. */
[data-theme="dark"] {
  --color-bg:   #1a1a1a;
  --color-text: #f0f0f0;
}

/* Optional fallback if the variable isn't defined */
.card { padding: var(--space-3, 1rem); }
```

Then in HTML: `<html data-theme="dark">` flips the whole page. No JS needed (other than to toggle the attribute).

> **CSS variables are inherited.** Set them on a parent, all descendants see them. This is what makes `[data-theme="dark"]` so cheap — no per-element overrides.

### `:hover`, `:focus-visible`, transitions — interactivity polish

A "raw" button that doesn't react to hover or focus feels broken. Three primitives close the gap:

```css
.button {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s;
}

/* Mouse hover */
.button:hover { background: #1e3d1a; }

/* Click — quick visual feedback */
.button:active { transform: translateY(1px); }

/* Keyboard focus — only when navigating via keyboard, NOT on click */
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Disabled */
.button:disabled { opacity: 0.5; cursor: not-allowed; }
```

**`:focus-visible` over `:focus`** — `:focus` highlights the element *every time* it gets focus, including after a mouse click. Most users find this ugly so devs disable it (`outline: none`) — which **removes keyboard navigation**. `:focus-visible` is the modern fix: outline only when the user is actually using the keyboard.

> **Never write `*:focus { outline: none; }` without a replacement.** That breaks keyboard accessibility for every interactive element on the page.

**`transition`** — animate between two states. The shorthand is `property duration timing-function delay`:

```css
.card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
```

For multi-step animations, use `@keyframes`:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.toast { animation: fade-in 0.2s ease-out; }
```

**Respect `prefers-reduced-motion`** — some users disable animations system-wide for vestibular reasons:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Responsive Design

A modern UI must work on a **360px phone** and a **2560px monitor** without two separate codebases. There are three layers:

#### 1. Media queries — mobile-first

Write base CSS for the smallest screen, then use `min-width` queries to **add** rules for larger screens:

```css
/* Base — phone */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

**Why mobile-first**: smaller screens get less CSS (perf), and you're forced to prioritize content (UX). A typical breakpoint set:

| Breakpoint | Why |
|---|---|
| `480px` | Large phones (landscape) |
| `768px` | Tablets |
| `1024px` | Small desktops |
| `1280px` | Large desktops |
| `1536px+` | XL displays |

Tailwind uses `sm: 640px / md: 768px / lg: 1024px / xl: 1280px / 2xl: 1536px` — close but slightly different. Pick a set and stick with it.

#### 2. Container queries — the modern game-changer

Media queries react to the **viewport**. Container queries react to the **parent's size**. Same component on a wide page and inside a narrow sidebar can adapt independently:

```css
.card-grid { container-type: inline-size; }

.card { display: flex; flex-direction: column; }

@container (min-width: 400px) {
  .card { flex-direction: row; }   /* side-by-side when its container is wide enough */
}
```

Now the card layout depends on **where it lives**, not on the whole page width. This is what makes truly reusable components.

Browser support is universal as of 2023. Use them.

#### 3. Fluid sizing without media queries

`clamp()` lets a value scale with viewport size between bounds — no breakpoints needed:

```css
/* Fluid type: 1rem on small screens, up to 1.5rem on large, scales smoothly */
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }

/* Fluid container padding */
.section { padding-inline: clamp(1rem, 5vw, 4rem); }
```

The middle value is the "ideal", the first is the floor, the last is the ceiling. Combine with media queries for complete responsive control: media queries for **layout breakpoints** (1 col → 2 col → 3 col), `clamp()` for **continuous sizing** (font, padding, gap).

#### 4. Aspect ratio

Reserve image/video space without juggling padding hacks:

```css
.video { aspect-ratio: 16 / 9; width: 100%; }
.avatar { aspect-ratio: 1; width: 64px; border-radius: 50%; }
```

#### Putting it together — a responsive card grid

```css
.cards {
  display: grid;
  /* Auto-fill: fit as many columns of >=240px as possible */
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  padding: clamp(1rem, 4vw, 3rem);
}
```

That's it — no media queries, but it goes from 1 column on a 360px phone to 6+ columns on a 4K monitor. This is the modern responsive default.

### Colors

```css
color: #333333;              /* hex (6 digits) */
color: #333;                 /* hex shorthand (3 digits) */
color: rgb(51 51 51);        /* rgb (modern space-separated syntax) */
color: rgb(51 51 51 / 0.5);  /* rgb with alpha (50% opacity) */
color: hsl(0 0% 20%);        /* hue, saturation, lightness */
color: oklch(0.5 0.1 200);   /* OKLCH — perceptually uniform, used by Tailwind v4 */
```

### Typography

```css
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;      /* base size — 1rem will equal this */
  line-height: 1.6;     /* unitless — multiplier of font-size */
  font-weight: 400;     /* 400 = normal, 700 = bold */
}

h1 { font-size: 2rem; }     /* 32px if base is 16px */
h2 { font-size: 1.5rem; }   /* 24px */

.small { font-size: 0.875rem; }  /* 14px */
```

## Learn More

- [MDN: CSS First Steps](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps)
- [MDN: Box Model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model)
- [MDN: Flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox)
- [MDN: Grid](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids)
- [MDN: Custom Properties (CSS Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN: `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [MDN: `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [CSS Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Specificity Calculator](https://specificity.keegan.st/)

## How to Work

1. **Study examples** — double-click to open in a browser, or via Vite dev server (recommended for live reload):
   ```bash
   cd santa-app && npm run dev
   # then open: http://localhost:5173/<path-to-example>
   # or: open src/05-frontend/lessons/02-css-basics/examples/box-model.html
   #     directly via file:// — works for static CSS demos.
   ```
   Files:
   ```
   src/05-frontend/lessons/02-css-basics/examples/box-model.html
   src/05-frontend/lessons/02-css-basics/examples/flexbox-layouts.html
   src/05-frontend/lessons/02-css-basics/examples/grid-layouts.html
   ```

2. **Complete exercises** — open the `.css` file in your editor, follow the TODO comments, refresh the `.html` in your browser to verify:
   ```
   src/05-frontend/lessons/02-css-basics/exercises/card-layout.html
   src/05-frontend/lessons/02-css-basics/exercises/card-layout.css
   src/05-frontend/lessons/02-css-basics/exercises/navigation.html
   src/05-frontend/lessons/02-css-basics/exercises/navigation.css
   ```

3. **Complete the App Task** below.

## App Task

### 1. Style the Login and Register Mockups

Take the mockups you built in Lesson 01 (`santa-app/public/mockups/login.html` and `register.html`). Create one shared stylesheet `santa-app/public/mockups/styles.css` and link it from both pages:

```html
<head>
  ...
  <link rel="stylesheet" href="styles.css">
</head>
```

In `styles.css`:

- **Reset** — `*, *::before, *::after { box-sizing: border-box; } * { margin: 0; }`
- **CSS variables** on `:root` — `--color-primary` (green or whatever palette you choose), `--color-bg`, `--color-text`, `--space-*`, `--radius`. Reuse them everywhere.
- **Body** — `font-family: system-ui, sans-serif; line-height: 1.6; color: var(--color-text); background: var(--color-bg);`
- **Page layout** — center the form vertically and horizontally using `min-height: 100dvh; display: grid; place-items: center;` on `<main>`.
- **Form card** — white background, `border-radius: var(--radius)`, subtle box-shadow, `max-width: 400px`, `padding: var(--space-4)`.
- **Inputs** — full-width, padding, border, border-radius. Add `:focus-visible` outline using `--color-primary`.
- **Submit button** — `--color-primary` background, white text, padding, `cursor: pointer`, `transition: background-color 0.15s`. On `:hover` darken the background.
- **Link** ("Don't have an account? Register") — link color matches `--color-primary`.
- **Responsive** — at the smallest screens (`@media (max-width: 480px)`), drop the form padding so it fits comfortably.

**Verify:**
- [ ] Open `http://localhost:5173/mockups/login.html` — form is centered, inputs styled, button shows hover effect
- [ ] Tab through with the keyboard — focus outlines are visible (no hidden focus)
- [ ] Resize browser to 360px wide — form still readable, no horizontal scrollbar
- [ ] DevTools → Elements → toggle `data-theme="dark"` on `<html>` — if you defined dark variables, page flips colors

### 2. Create a responsive Room Card grid

Create `santa-app/public/mockups/rooms.html` + `rooms.css`. Build a list of 6 mock room cards.

**Each card** shows: room name, room code (mono font), participant count, status badge (`pending` / `drawn` / `closed` with different colors), "Open" button.

**Grid** — use the modern default:

```css
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  padding: clamp(1rem, 4vw, 3rem);
}
```

This works on every screen size — no media queries needed for the columns.

> **Why not media queries with `1fr 1fr 1fr` per breakpoint?** The `auto-fill, minmax(...)` approach scales smoothly from 360px (1 column) to 4K (many columns). It's the modern responsive default. If your designer hands you mockups with explicit "3 columns on desktop, 2 on tablet, 1 on mobile" — that's also a valid choice; both are in the lesson. Pick the modern one unless you have a specific reason.

**Card styling** — card background, `border-radius`, subtle shadow, `padding`. Add `transition: transform 0.15s, box-shadow 0.15s;` and on `:hover` lift it: `transform: translateY(-2px); box-shadow: deeper`.

**Status badge** — small rounded pill. Each status gets a different `background` + `color`. Use CSS variables for the three colors.

**Verify:**
- [ ] At 1400px viewport, you see 5+ columns
- [ ] At 768px, you see 3 columns
- [ ] At 360px, you see 1 column
- [ ] Hover on a card — it lifts slightly with a smooth transition
- [ ] Tab through the "Open" buttons — focus outline visible
- [ ] No horizontal scrollbar at any width
