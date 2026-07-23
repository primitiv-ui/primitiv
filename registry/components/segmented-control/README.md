# `segmented-control` — registry entry

The artefacts `primitiv add segmented-control` resolves and copies into a
consumer repo. SegmentedControl is a **root plus one repeated subcomponent**
(`Item`): the consumer drops N items into the root, which owns the track; each
item styles itself off its own `data-state`.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the transparent bordered track + framed segments). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `segmented-control.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `segmented-control.tsx` | generated | The styled wrappers — `SegmentedControl` / `SegmentedControlItem` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** and pinned to their source by
drift-guard tests.

## The default theme (`styles.css`)

A single-select value picker that reads as part of the **Button** family. The
root is a **transparent, bordered frame** (so the control sits on any surface —
card, toolbar, coloured hero) whose corner radius is **concentric** with the
segments: the item radius plus the track padding, so the outer curve runs
parallel to the inner one at every size. Each segment is a framed button — the
selected one (`data-state="checked"`) is brand-filled (`action/primary`), the
rest are secondary (`action/secondary`).

This is the **RadioGroup** model — exactly one segment is always selected — not a
toggle group. Reach for [`toggle-group`](../toggle-group/README.md) when the
buttons are on/off commands that can each be pressed independently.

Structured per RFC 0008 — per-component API tokens + resting look in
`primitiv.base`, the `size` / `justify` modifiers in `primitiv.variants`, the
`data-state="checked"` / `:hover` / `:focus-visible` / `data-disabled` styling in
`primitiv.states`. It wires `--primitiv-segmented-control-*` to **semantic tokens
only**: `framed-control/{size}/*` for segment sizing + the item radius,
`action/secondary/*` (unselected) and `action/primary/*` (selected) for colour,
`border/subtle` for the track frame, `space-4` for the track padding/gap,
`label/{size}/*` for type, and the shared `focus-ring/*` for the ring.

## Notes

- **Concentric radius.** `--primitiv-segmented-control-radius` is
  `calc(item-radius + track-padding)`, so the frame never looks too tight against
  the segments; it re-derives automatically when the `size` modifier re-points
  the item radius.
- **`justify`.** Omitted, segments are content-width; `justified` makes them
  share the track width equally — the classic equal-width segmented control.
- **Transparent track.** The frame paints no fill of its own (the segments carry
  their surfaces), so the control drops onto any background; only the
  `border/subtle` outline groups it.
- **Focus** is the shared two-layer ring following the segment's own radius, with
  the gap band keyed to `surface/default`; the focused segment lifts above its
  neighbours (`position: relative; z-index: 1`) so the outset ring isn't overdrawn.
- **Label trim.** `SegmentedControlItem` wraps string/number children in a
  `.primitiv-segmented-control__item-label` span (via the contract's per-part
  `wrapTextChildren`, mirroring Button's `__label`); element children — icons —
  pass through unwrapped. `text-box-trim` / `text-box-edge` live on that span so
  the label optically centres regardless of the font's metrics.
