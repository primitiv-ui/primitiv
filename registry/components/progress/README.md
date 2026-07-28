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

// Intent picks the fill colour:
<Progress value={60} intent="danger" aria-label="Quota used">
  <ProgressIndicator />
</Progress>
```

## The default theme (`styles.css`)

Root is the track (a pill-shaped, clipping bar); `Indicator` is the fill.
The fill transforms with `scaleX` (not an animated `width`) —
compositor-friendly, and it transitions smoothly between values via
`--primitiv-motion-duration-expand`. Size only re-points the track height
(`progress/{size}/height`, a new Context family added for this build).

Colour, verified binding-for-binding against the live Figma `Progress` set via
the Desktop Bridge:

| Part | Token |
|---|---|
| Track (all intents) | `action/secondary/default` |
| Fill — `intent="primary"` | `action/primary/default` |
| Fill — `intent="secondary"` | `action/secondary/active` |
| Fill — `intent="danger"` | `action/danger/default` |

The **track is deliberately not part of the `intent` axis** — Figma binds it to
`action/secondary/default` on all three, so a danger bar reads as a danger
*fill* on the same neutral track rather than a wholly recoloured control.
`secondary` takes the `active` step rather than `default` because `default` is
what the track already uses, and a fill needs to differ from its track to be
legible.

An earlier build shipped **no `intent` axis at all** (every bar was brand-
coloured) and had the track on `surface/subtle`. That last one was invisible:
`surface/subtle` and `action/secondary/default` both alias `color.neutral.100`
in *both* themes, so the two were pixel-identical — which is exactly what made
the divergence worth closing, since a later change to either token would have
silently pulled the track off-spec.

**Indeterminate** (`data-state="indeterminate"`, `value` omitted) swaps to a
looping slide animation instead of reading the fill formula — the headless
layer never sets `--primitiv-progress-value` while indeterminate, so the
formula would otherwise always resolve to `scaleX(0)`. Guarded under
`prefers-reduced-motion: reduce` with a static half-opacity bar. The travelling
bar is 30% of the track, matching the Figma indeterminate variant's own fill
width (72 of a 240px track).

## Tokens

`--primitiv-progress-*` wires to the new `progress/{size}/height` Context
family, `radii/full` (the pill shape), `action/secondary/default` +
`action/primary/default` / `action/secondary/active` / `action/danger/default`
for colour, and `motion/*` for the fill transition.
Requires the token layer (`primitiv tokens`).
