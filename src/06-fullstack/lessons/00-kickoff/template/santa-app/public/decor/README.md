# Decor assets

Brand SVGs used across the app. **These ship in the repo** — you don't need to
re-export them from Figma.

| File | What | Used on (per the mockups) |
|------|------|---------------------------|
| `santa-hat.svg` | Santa hat mark (red cone + white brim + pompom) | Login/Register badge, Landing hero, the "Secret Santa" logo on Rooms |
| `snowflake.svg` | Frost-blue snowflake | Decorative scatter on the Rooms dashboard |

Colors are the design tokens: hat red = `--primary` (`#C2410C`), snowflake =
`--frost` (`#A9C5D1`). See [`../../docs/design-system.md`](../../docs/design-system.md).

## How to use

They're plain files in `public/`, so reference them by absolute path:

```tsx
{/* Logo / brand mark */}
<img src="/decor/santa-hat.svg" alt="" className="size-6" />

{/* Hat badge (hat on a soft circle) — the login/register pattern */}
<span className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
  <img src="/decor/santa-hat.svg" alt="" className="size-10" />
</span>

{/* Decorative snowflake (absolute-positioned, low opacity) */}
<img src="/decor/snowflake.svg" alt="" className="pointer-events-none absolute opacity-50" />
```

> Prefer an inline, recolorable SVG? Paste the file's contents into a small
> React component (e.g. `src/components/icons/SantaHat.tsx`) and swap the fills
> for `currentColor` where you want it to inherit text color. Static `<img>` is
> fine for everything in the mockups.

## Optional 3D illustrations

The landing hero in the mockup uses a simple gradient panel with the hat. If you
want richer festive art (3D Santa, tree, gifts), export it from the Figma file
as SVG/PNG and drop it here. Keep each asset under ~150 KB; prefer SVG.
