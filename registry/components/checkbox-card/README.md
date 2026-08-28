# `checkbox-card` — registry entry

The artefacts `primitiv add checkbox-card` resolves and copies into a
consumer repo — a card/tile-shaped checkbox where the whole bordered
surface is the interactive element, not a small control plus a separate
label. Composes the headless
[`CheckboxCard`](../../../packages/react/src/CheckboxCard/README.md)
primitive (`role="checkbox"`).

## What it does

`CheckboxCard` renders a `<button role="checkbox">` with a persistent
indicator box (bordered, always visible — the tick mark inside is only
shown while checked or indeterminate), a required title, and an optional
description. Sized `xs`–`xl` (default `md`); `data-density` scales each
size further. Independent tri-state (unchecked/checked/indeterminate) —
each card is standalone, with no grouping.

## Usage

```tsx
import { CheckboxCard } from "@/components/checkbox-card";

<CheckboxCard
  defaultChecked
  aria-label="Enable dark mode"
  title="Dark mode"
  description="Switch the interface to a dark colour scheme."
/>

{/* Indeterminate, controlled */}
<CheckboxCard
  checked={selectAllState}
  onCheckedChange={setSelectAllState}
  title="Select all permissions"
  description="2 of 3 permissions granted."
/>

{/* No description */}
<CheckboxCard title="Email notifications" showDescription={false} />
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-checkbox-card` root class, the `size` modifier, the `data-state`/`data-disabled` hooks, and the `--primitiv-checkbox-card-*` custom properties. |
| `styles.css` | **authored** | The canonical default theme: the card box + indicator + title/description type, in `@layer primitiv.base`/`primitiv.variants`/`primitiv.states`. |
| `styles.scss` | **authored** | `styles.css` plus a trailing `$`-alias block, one `$primitiv-checkbox-card-<prop>` per custom property. |
| `checkbox-card.recipe.ts` | **authored** | `cva("primitiv-checkbox-card", { variants: { size } })` — mirrors `alert`'s recipe shape. |
| `checkbox-card.tsx` | **authored** | The `<CheckboxCard>` wrapper — composes the headless `CheckboxCard` primitive. |

Because the indicator/title/description anatomy has no generator-emitted
shape, `checkbox-card.tsx`/`checkbox-card.recipe.ts` are **not** generated
by `primitiv-emit` and carry **no drift-guard test** (contrast the
generated wrappers, D53). `checkbox-card.tsx` is type-checked in CI by
`scripts/check-registry-types.mjs` like every other registry wrapper.

## Tokens

`checkbox-card` uses a new dedicated `choice-card/*` token family (shared
with `radio-card`, decoupled from ToggleGroup's `surface/selected`):

- **`choice-card/{size}/padding`** — the card's own padding (`framed-
  control`'s padding-inline is sized for compact single-row controls, too
  small for a multi-line card).
- **`choice-card/{size}/gap`** — the indicator↔content gap. Deliberately
  one step above the shared `choice-control/{size}/gap`, which
  `checkbox`/`radio`/`switch` keep: a card needs more room than an inline
  control.
- **`choice-card/{size}/content-gap`** — the title↔description gap.
  Explicit because both texts are cap-trimmed, so no leading contributes to
  the rhythm.

There is deliberately **no** indicator-offset token — see "Optical
alignment" below.
- **`choice-card/selected/{background,border}`** — the checked/
  indeterminate card treatment.

Everything else reuses existing families directly: the indicator box
reuses Checkbox's own `checkbox/{size}/{box-size,box-radius,mark-size}`
sizing and its tick-mark `clip-path` polygon (re-clipped to a bar for
indeterminate);
`framed-control/{size}/radius` for the card radius; `label/{size}/*` /
`body/{size}/*` for title/description type; the shared
`--primitiv-focus-ring*` two-layer ring; `elevation/raised` for the hover
lift (matching Button's own hover lift).

## Optical alignment (no token, on purpose)

The indicator has to centre on the **cap-height centre of the title's first
line** — not on its line box. Those are different: the cap centre sits about
1.16px above the line-box centre in Khand, whose ascent (1.056em) and descent
(0.5em) are asymmetric, so line-box centring reads visibly low.

This used to be a per-size `choice-card/{size}/indicator-offset-top` token.
It was deleted (2026-08-26) because **no value on the 2px space scale can be
right**: the correct offset depends on cap height, ascent, line-height *and*
indicator size simultaneously, it ranges from -0.8px to 3.02px across the 20
size x density combinations, and it is non-monotonic (at `dense`/`xl` the
control is taller than its own line box). The shipped values were up to
3.53px out at the large end — measured in a browser, not estimated.

The replacement derives it from the font:

```css
.primitiv-checkbox-card__title,
.primitiv-checkbox-card__description {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
}
.primitiv-checkbox-card__indicator-wrapper {
  display: flex;
  align-items: center;
  font-family: var(--primitiv-checkbox-card-title-font-family);
  font-size: var(--primitiv-checkbox-card-title-font-size);
  block-size: 1cap;
}
```

Worst-case error across all 20 combinations: **0.14px**, versus 9.92px before.

Three things are load-bearing if you edit this:

- **`1cap` resolves against the wrapper's own font**, so the wrapper must
  carry the title's `font-family` and `font-size`. They are not decoration.
- **`display: flex` is required.** As a block containing an `inline-flex`
  indicator, the indicator sits on a text baseline and picks up half-leading
  that scales with the font-size just set above — which silently
  reintroduces a size-dependent error.
- **A cap-tall box with the control centred**, rather than a negative margin
  on a hug-height box. Both align correctly, but a negative margin leaves the
  control hanging below the baseline — its outer box stays taller than the
  trimmed title — which drives the card's height and puts up to 6.35px more
  space under the text than above it. Very visible on a card with no
  description. Centring in a cap-tall box contributes exactly `1cap` to
  layout, so the padding stays even.

Cap-trimming moves descenders **outside** the text box, so no ancestor may
clip the content column, or they are cut off. The card's own padding gives
them room.

Figma expresses the same model with `leadingTrim: CAP_HEIGHT` plus a cap-tall
Indicator Wrapper bound to a **Figma-only** `choice-card/{size}/title-cap-height`
variable, because Figma has neither negative margins nor a way to compute a
font metric into layout. That variable is deliberately absent from
`packages/tokens` — the same split as `segmented-control/{size}/radius`.

## Notes

- **The indicator box is always rendered; only the mark is conditional.**
  The headless `CheckboxCard.Indicator` unmounts entirely while unchecked
  (by design — the accessible state is already conveyed by `aria-checked`).
  The wrapper keeps the bordered box itself as a plain `<span>` so it never
  disappears, and nests the headless `Indicator` (holding just the tick/
  dash mark) inside it — otherwise the card would show no box at all when
  unchecked.
- **State styling is attribute-driven, not prop-driven.** `data-state`
  (`checked`/`unchecked`/`indeterminate`) and `data-disabled` come from the
  headless primitive automatically; the stylesheet keys off them directly
  rather than a JS variant, since they change at runtime, not compile time.
- **No `asChild`.** Like `Alert` and `Chip`, the multi-part indicator/
  title/description anatomy doesn't compose with `asChild` the way a
  single wrapping element does.
- **No layout prop.** Stacking cards vertically, in a row, or in a grid —
  and the indented "select all" parent-plus-children pattern — are
  deliberately left to composition (`Stack` or a plain grid wrapper), not
  baked into this component. See the "CheckboxCard, RadioCard —
  exploration" Figma page for the design record.
