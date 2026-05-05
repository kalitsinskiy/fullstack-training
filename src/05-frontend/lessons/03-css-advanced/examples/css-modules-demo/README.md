# CSS Modules Demo

This folder shows how CSS Modules work in a React + Vite + TypeScript project.

## Files

- `Card.module.css` — the CSS Module file (class names are locally scoped)
- `Card.tsx` — React component that imports the CSS Module

## How to Use

CSS Modules cannot run directly in a browser. You need a build tool (Vite, webpack, etc.)
that processes `.module.css` files.

To try it out:

1. Copy these files into your `santa-app` Vite project (e.g., `src/components/`)
2. Import the `Card` component in `App.tsx`
3. Run `npm run dev`

Vite handles `.module.css` files automatically — no extra config needed.

## What Happens at Build Time

When Vite sees `import styles from './Card.module.css'`:

1. It reads `Card.module.css`
2. Each class name gets a unique suffix: `.card` becomes `.Card_card_x7d2k`
3. The `styles` object maps original names to generated names: `{ card: 'Card_card_x7d2k', title: 'Card_title_a3b1c', ... }`
4. You use `styles.card` in JSX, and the unique class name is applied

This means your `.card` class in this file will never conflict with a `.card` class in another file.
