# `slider` — registry entry

The artefacts `primitiv add slider` resolves and copies into a consumer
repo. A draggable, keyboard-accessible control for one value or a range,
composed from four parts.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `slider.recipe.ts` | generated | The `cva` recipes over the contract's root + part classes (from `contract.json`). |
| `slider.tsx` | generated | The styled wrapper — `<Slider>` + `<SliderTrack>`/`<SliderRange>`/`<SliderThumb>` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and
pinned to their source by drift-guard tests, so they can't fall out of sync
(D53).

## Usage

```tsx
import { Slider, SliderTrack, SliderRange, SliderThumb } from "@/components/slider";

// Single thumb
<Slider defaultValue={[40]} aria-label="Volume">
  <SliderTrack>
    <SliderRange />
  </SliderTrack>
  <SliderThumb />
</Slider>

// Range — one Thumb per value entry
<Slider defaultValue={[20, 80]} aria-label="Price range">
  <SliderTrack>
    <SliderRange />
  </SliderTrack>
  <SliderThumb aria-label="Minimum" />
  <SliderThumb aria-label="Maximum" />
</Slider>
```

## No position math in the stylesheet

The headless layer computes every positioning percentage itself — `Root`
measures its own bounding rect, and `Range`/`Thumb` each receive an inline
`left`/`right`/`top`/`bottom` style already resolved from
`value`/`min`/`max`/`orientation`/`dir`/`inverted`. This stylesheet supplies
no position math, only the geometry and colour each part reads:

- **`Track`** fills `Root`'s content box exactly, so the same measured rect
  is correct for both `Range`'s percentages (anchored on `Track`, its DOM
  parent) and `Thumb`'s (anchored on `Root` directly — `Thumb` is `Track`'s
  sibling, not nested inside it).
- **`Thumb`'s cross axis** (the one the headless layer doesn't set) is
  centred in CSS with `inset-*-start: 50%`, split per `[data-orientation]`
  so it never collides with the JS-set inset on the *value* axis — setting
  opposite insets on the same physical property stretches an absolutely
  positioned box instead of centring it.

## The default theme (`styles.css`)

Sized off the pre-existing `slider/{size}/*` Context family
(`thumb-size`, `thumb-ring-size`, `thumb-ring-gap-size`, `track-thickness`)
— built ahead of this component landing. The focus ring reuses those same
`thumb-ring-*` tokens (not the generic `--primitiv-focus-ring-offset/-width`)
so a draggable handle gets a visibly bigger ring than a text field's
border-hugging one; the spread is derived as `(ring token − thumb size) / 2`
since a ring token is a diameter and `box-shadow` spread is a radius delta.

Colour, verified binding-for-binding against the live Figma `Slider` set via
the Desktop Bridge:

| Part | Token |
|---|---|
| Track | `action/secondary/border/default` |
| Range (the filled portion) | `action/primary/default` |
| Thumb border | `action/secondary/border/default` |
| Thumb fill | `surface/default` (see below) |
| Thumb hover glow | `action/primary/default` at `opacity/20` |

An earlier build had the track on `surface/subtle` (`neutral/100` — visibly
paler than the spec'd `neutral/300`), the thumb border on
`action/primary/default` (a brand-coloured ring where Figma draws a neutral
one), and **no hover state at all** — Figma's Thumb component carries a
`glow` layer, hidden on every variant but `State=hover`.

The glow is an annulus (`::before` with a transparent interior and a border as
thick as the glow extends), not a filled disc: within a stacking context — and
`translate` on the thumb creates one — a `z-index: -1` child still paints
*above* its parent's background, so a disc could not be put behind the thumb's
face. Keeping it off `box-shadow` also lets it coexist with the focus ring,
which owns that property.

### One deliberate difference: the thumb fill

Figma binds the thumb's fill to the **`color/white` primitive**, which resolves
to `#ebebeb` in *both* Light and Dark modes — so in Figma the thumb does not
invert with the theme. This build uses **`surface/default`** instead
(`absolute-white` / `black`), which does. That is a deliberate departure: a
control that keeps a near-white face on a dark surface is a theming bug, and
`surface/default` is the token every other framed control uses for its own
face. Worth correcting on the Figma side rather than matching here.

## Tokens

`--primitiv-slider-*` wires to the pre-existing `slider/{size}/*` Context
family, `radii/full` (track + thumb shape), `action/secondary/border/default` +
`action/primary/default` + `surface/default` for colour, `opacity/20` for the
hover glow, and the shared `--primitiv-framed-control-border-width` for the
thumb's border. Requires the token layer (`primitiv tokens`). No new tokens.
