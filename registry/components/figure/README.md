# `figure` — registry entry

The artefacts `primitiv add figure` resolves and copies into a consumer
repo — the `<figure>`/`<figcaption>` prose component from RFC 0023 / RFC
0015. Like `prose`, `figure` has **no headless `@primitiv-ui/react`
counterpart** — RFC 0015 decided against one — so it ships entirely from the
registry.

## What it does

`Figure` wraps self-contained content (an image, illustration, chart, code
listing, table) with an optional caption in one of three positions:

- `"below"` (default) — caption below the media.
- `"above"` — caption above the media.
- `"overlay"` — caption pinned over the bottom of the media on a scrim bar
  (`surface/inverse` background at 90% opacity, `content/inverse` text — the
  `inverse` token pair, so it inverts together against either theme).

Two more axes, both matching the Figma sets:

- `size` — `"xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`). Scales the
  **caption's type only**, off the `body/{size}` ramp. The media is
  size-independent, exactly as in Figma, where the `Figure` set's `Size` axis
  drives nothing but the nested Figcaption and the media placeholder is
  resized freely. `caption-gap` is a single density-scaled token rather than a
  per-size one, so it doesn't move with `size` either.
- `Figure.Caption`'s `align` — `"start" | "center" | "end"` (default
  `"start"`), matching the Figcaption set's `Align` axis
  (`textAlignHorizontal` on a caption that fills the figure's width). Logical
  keywords, so `start`/`end` flip under RTL.

An earlier build shipped neither: the caption was locked to `body/md` at every
size, and had no alignment control at all.

Compose `Figure.Media` (clips its content to the figure's corner radius) and
`Figure.Caption`.

### A platform difference from the Figma build

In Figma, the overlay caption must be a physical child of the media frame so
it clips to the frame's rounded corners. On the web, `Figure.Media` and
`Figure.Caption` stay **DOM siblings in every position** — the stylesheet
positions the caption over the media's bottom edge with `position: absolute`
inside a `position: relative` figure, and matches the caption's own bottom
corner radii to the media's radius, achieving the same seamless look without
requiring the two parts to nest.

Keeping them as siblings does mean the scrim has to be **explicitly contained**.
The caption carries `isolation: isolate`, because `position: absolute` alone
does *not* create a stacking context — without it the scrim's `z-index: -1`
escapes the caption and paints against the nearest ancestor that is one, landing
*behind* the media instead of over it. With any media that isn't fully opaque
the scrim then shows through the artwork, reading as a stray dark panel behind
it with the media's own tone floating on top. A follow-up pass fixed this; the
overlay shipped without the containment.

### The overlay scrim is opaque — the RFC's 90% was dropped

RFC 0015 specifies the scrim in two places as `surface/inverse` at **90%**
opacity (§4, "The scrim is **solid** (90% opacity) for v1", and its
confirmed-on-human-review deviations list, "*a hint of media shows through*").
**The shipped scrim is opaque**, matching the live Figma build rather than the
RFC — verified both ways via the Desktop Bridge (the overlay Caption frame is
`opacity: 1` with one solid fill at `opacity: 1` bound to `surface/inverse` →
`color/neutral/800` at `a = 1`) and by measurement in a browser
(`rgb(32, 35, 40)`, no alpha channel).

Two reasons the 90% went, both found while implementing it:

- The translucent build needed a `z-index: -1` pseudo-element, and that needed
  `isolation: isolate` to stop it escaping the caption and painting *behind* the
  media — `position: absolute` alone is not a stacking context. Opaque collapses
  the whole mechanism to one declaration.
- Against anything other than flat artwork, the 10% read as the media bleeding
  through the bar rather than as a deliberate hint.

A translucent scrim is still one override away, no rule editing required — point
`--primitiv-figure-overlay-scrim` at a colour that carries its own alpha. RFC
0015 §9 defers a first-class token for it.

*(This section previously recorded the opposite — code at 90%, Figma drifted. It
was left stale when the scrim was made opaque; corrected during the Figma ↔
kitchen-sink audit.)*

### The caption's `margin: 0` and `font-weight` are both load-bearing

`primitiv.reset` dresses a bare `figcaption` at `body/sm` **and** gives it
`margin-block-start: var(--primitiv-figure-caption-gap)`. A declaration on the
element beats an inherited one whatever the layer, so:

- **`margin: 0`** is what stops the reset's margin adding to this figure's flex
  `gap`. Delete it and the media-to-caption distance silently doubles — the same
  fault `list` shipped with. Measured at 0 in every density mode.
- **`font-weight`** is declared from the component's own size axis for the same
  reason. Without it the caption's weight stayed pinned to `body/sm`'s while
  family, size and line-height tracked `size`. Every step's
  `body.<size>.font-weight` currently resolves to `regular`, so nothing rendered
  wrong — it was a latent pin that would have surfaced the moment one step
  diverged. Figma binds this node to `body/{size}/font-style` (Regular), i.e. the
  same axis as the rest of its type.

## Usage

```tsx
import { Figure } from "@/components/figure";

<Figure captionPosition="overlay" size="sm">
  <Figure.Media>
    <img src="…" alt="…" />
  </Figure.Media>
  <Figure.Caption align="center">A caption.</Figure.Caption>
</Figure>
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-figure` root class, the `--below`/`--above`/`--overlay` and `--xs…--xl` modifiers, the `__media`/`__caption` parts (with the caption's own `--start`/`--center`/`--end`), and the `--primitiv-figure-*` custom properties. |
| `styles.css` | **authored** | The canonical default theme: Flexbox ordering for below/above, absolute positioning + scrim for overlay, in `@layer primitiv.base`/`primitiv.variants`. |
| `styles.scss` | **authored** | `styles.css` plus a trailing `$`-alias block, one `$primitiv-figure-<prop>` per custom property. |
| `figure.recipe.ts` | **authored** | `cva("primitiv-figure", { variants: { captionPosition, size } })` plus `figureCaption` — `cva("primitiv-figure__caption", { variants: { align } })`. |
| `figure.tsx` | **authored** | The `<Figure>`/`<Figure.Media>`/`<Figure.Caption>` wrappers. Hand-written (there is no primitive to generate from). |

Because there is no headless primitive, `figure.tsx`/`figure.recipe.ts` are
**not** generated by `primitiv-emit` and carry **no drift-guard test**
(contrast the generated wrappers, D53). `figure.tsx` is type-checked in CI by
`scripts/check-registry-types.mjs` like every other registry wrapper.

## Tokens

`figure` consumes the shared, density-scaled `figure/caption-gap` Context
token directly — like `prose` does with `flow/*`, it is **not** re-declared
under a component-owned name. It also owns `--primitiv-figure-media-radius`
(aliasing `radii/8`), `--primitiv-figure-caption-color` (`content/muted`),
and the overlay pair `--primitiv-figure-overlay-scrim`/
`-overlay-caption-color` (the `inverse` token pair — `surface/inverse` +
`content/inverse`), plus the `body/{size}`-aliased type scale. No new tokens
beyond `figure/caption-gap`, which had already landed (RFC 0015 §5.1).
