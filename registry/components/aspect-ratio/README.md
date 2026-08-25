# `aspect-ratio` — registry entry

The artefacts `primitiv add aspect-ratio` resolves and copies into a
consumer repo — the media-ratio layout primitive from RFC 0022 (build-order
step 2). Like `box`, `aspect-ratio` has **no headless `@primitiv-ui/react`
counterpart**: `<AspectRatio>` carries zero behaviour, so it ships entirely
from the registry.

## No Figma counterpart

There is deliberately **no Figma component set** for this primitive, and none is
planned — confirmed by a sweep of every page in the Primitiv Design System file
(the `---- LAYOUT ----` section holds only `Divider`). It renders no visual
affordance of its own: everything it does is layout behaviour that Figma
expresses natively through auto-layout, so a component set would encode
nothing a designer could use. There is therefore nothing to cross-check its
tokens or variant axes against — RFC 0022 (§5, §8, §9) is its whole spec, and
the `Figma` column of `ROADMAP.md` reads `—` for exactly this reason.

## What it does

`AspectRatio` constrains embedded media (an image, video, map, iframe) to a
width-to-height ratio via the modern CSS `aspect-ratio` property — no
padding-bottom hack. The child is wrapped in a `__content` element that fills
the ratio box regardless of the child's own intrinsic size — a single-cell grid,
so it fills while staying in flow.

- `ratio` — a curated preset: `"1/1"` (default), `"4/3"`, `"3/2"`, `"16/9"`,
  `"21/9"`, and the portrait inverses `"3/4"`, `"2/3"`, `"9/16"`. Each is a
  modifier class that re-points `--primitiv-aspect-ratio`.

  For a **bespoke ratio**, override that custom property in your own stylesheet
  rather than inline:

  ```css
  .my-hero-media { --primitiv-aspect-ratio: 2.75; }
  ```

  The first build took `ratio` as a raw number and wrote it inline. Presets
  instead, because a component that writes a `style` attribute has an
  under-designed API — and the ratios anyone actually reaches for are a short
  list. `AspectRatio` now writes no `style` attribute at all.

An `<img>`/`<video>` child still needs its own `object-fit: cover` (or
`contain`) to crop rather than distort — `AspectRatio` only reserves the
box; it doesn't style the media inside it.

The box also `overflow: hidden`s, so content larger than the ratio is cropped
rather than spilling out of it.

### Gotcha: do not set `align-items` on a container of ratio boxes

Lay ratio boxes out with a Grid and **leave `align-items` alone**:

```tsx
// ✓ the row sizes to the taller box; each box keeps its own ratio.
<div className="my-two-up-grid">   {/* display: grid; grid-template-columns: 1fr 1fr */}
  <AspectRatio ratio="16/9">...</AspectRatio>
  <AspectRatio ratio="1/1">...</AspectRatio>
</div>
```

Grid resolves each column to a definite width before any height is needed, so
`aspect-ratio` gives each box a **definite block size**. The default
`align-items: stretch` then leaves that alone — stretch only applies to an `auto`
cross size — and the row sizes to the tallest box. Everything works.

Adding **`align-items: start`** (or `flex-start`/`center`/`end`) breaks it. Those
values take the items out of the row's sizing, so the row collapses to the
content's own height while each box still *renders* at its ratio height — and the
taller box paints straight over whatever follows it on the page.

This bit the kitchen-sink twice, both times from `align-items` rather than from
the component:

| Container | Row reserved | Boxes rendered | Result |
|---|---|---|---|
| flex, default `stretch`, no in-flow content | 264 | 264 / 264 | both boxes collapsed to the content's height |
| grid, `align-items: start` | 300 | 266 / **472** | correct ratios, row 172px short — the 1:1 box overflowed |
| grid, default `stretch` | **472** | 266 / 472 | correct |

Measured in Chrome over the DevTools Protocol against the deployed build, which
is the only way this was pinned down — three plausible-sounding CSS diagnoses
were wrong before the measurements arrived.

`overflow: hidden` is kept as a backstop, so even a mis-sized box crops rather
than painting over the page.

## Usage

```tsx
import { AspectRatio } from "@/components/aspect-ratio";

<AspectRatio ratio="16/9">
  {/* object-fit is yours: AspectRatio only reserves the box */}
  <img src="..." alt="..." className="my-cover-image" />
</AspectRatio>
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-aspect-ratio` root class, the eight `--1-1`...`--9-16` ratio modifiers, the `__content` part, and the `--primitiv-aspect-ratio` custom property. |
| `styles.css` | **authored** | The canonical default theme: the `aspect-ratio` + content-fill rules, in `@layer primitiv.base`. |
| `styles.scss` | **authored** | `styles.css` plus a trailing `$primitiv-aspect-ratio` alias. |
| `aspect-ratio.recipe.ts` | **authored** | `cva("primitiv-aspect-ratio", { variants: { ratio } })` over the eight ratio presets. |
| `aspect-ratio.tsx` | **authored** | The `<AspectRatio>` wrapper. Hand-written (there is no primitive to generate from): resolves `ratio` through the recipe and wraps `children` in the content element. Writes no `style` attribute. |

Because there is no headless primitive, `aspect-ratio.tsx`/
`aspect-ratio.recipe.ts` are **not** generated by `primitiv-emit` and carry
**no drift-guard test** (contrast the generated wrappers, D53).
`aspect-ratio.tsx` is type-checked in CI by `scripts/check-registry-types.mjs`
like every other registry wrapper.

## Tokens

None beyond its own `--primitiv-aspect-ratio` knob, re-pointed by the `ratio`
preset classes (and overridable in a consumer stylesheet for a bespoke ratio).
`aspect-ratio` owns no design tokens — see RFC 0022 §3.
