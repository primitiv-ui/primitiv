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
Colour is `surface/subtle` (track), `action/primary/default` (range + thumb
border), `surface/default` (thumb fill) — no new colour tokens.

## Tokens

`--primitiv-slider-*` wires to the pre-existing `slider/{size}/*` Context
family, `radii/full` (track + thumb shape), `surface/*` +
`action/primary/default` for colour, and the shared
`--primitiv-framed-control-border-width` for the thumb's border. Requires
the token layer (`primitiv tokens`).
