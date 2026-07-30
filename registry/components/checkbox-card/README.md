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
- **`choice-card/{size}/indicator-offset-top`** — the same optical-
  alignment nudge `alert`'s icon uses, aligning the indicator's visual top
  with the title's cap-height (a function of the shared `label/*` type
  scale, independent of the indicator's own size).
- **`choice-card/selected/{background,border}`** — the checked/
  indeterminate card treatment.

Everything else reuses existing families directly: the indicator box
reuses Checkbox's own `checkbox/{size}/{box-size,box-radius,mark-size}`
sizing and its tick-mark `clip-path` polygon (re-clipped to a bar for
indeterminate); `choice-control/{size}/gap` for the indicator↔content gap;
`framed-control/{size}/radius` for the card radius; `label/{size}/*` /
`body/{size}/*` for title/description type; the shared
`--primitiv-focus-ring*` two-layer ring; `elevation/raised` for the hover
lift (matching Button's own hover lift).

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
