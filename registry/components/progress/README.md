# `progress` — registry entry

The artefacts `primitiv add progress` resolves and copies into a consumer
repo. Progress is a display-only track + fill (WAI-ARIA progressbar
pattern) — no interaction, always consumer-driven.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `progress.recipe.ts` | generated | The `cva` recipes over the contract's root + part classes (from `contract.json`). |
| `progress.tsx` | generated | The styled wrapper — `<Progress>` + `<ProgressIndicator>` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and
pinned to their source by drift-guard tests, so they can't fall out of sync
(D53).

## `value`/`max` as style-props

`value` and `max` are the contract's `styleProps` (the same mechanism the
Carousel's `slidesPerPage` uses): the generated `<Progress>` wrapper writes
them onto `--primitiv-progress-value`/`-max` as **inline custom properties
on the root**, which inherit down to `<ProgressIndicator>`, and re-forwards
both props to the headless primitive unchanged. One prop pair drives both
the ARIA behaviour (`aria-valuenow`, the resolved `data-state`) and the
visual fill — the stylesheet needs no hand-written width/measurement logic.

## Usage

```tsx
import { Progress, ProgressIndicator } from "@/components/progress";

<Progress value={60} aria-label="Upload progress">
  <ProgressIndicator />
</Progress>

// Indeterminate — omit value:
<Progress aria-label="Loading">
  <ProgressIndicator />
</Progress>
```

## The default theme (`styles.css`)

Root is the track (a pill-shaped, clipping bar); `Indicator` is the fill.
The fill transforms with `scaleX` (not an animated `width`) —
compositor-friendly, and it transitions smoothly between values via
`--primitiv-motion-duration-expand`. Size only re-points the track height
(`progress/{size}/height`, a new Context family added for this build);
colour is `surface/subtle` (track) and `action/primary/default` (fill), no
new colour tokens.

**Indeterminate** (`data-state="indeterminate"`, `value` omitted) swaps to a
looping slide animation instead of reading the fill formula — the headless
layer never sets `--primitiv-progress-value` while indeterminate, so the
formula would otherwise always resolve to `scaleX(0)`. Guarded under
`prefers-reduced-motion: reduce` with a static half-opacity bar.

## Tokens

`--primitiv-progress-*` wires to the new `progress/{size}/height` Context
family, `radii/full` (the pill shape), `surface/subtle` +
`action/primary/default` for colour, and `motion/*` for the fill transition.
Requires the token layer (`primitiv tokens`).
