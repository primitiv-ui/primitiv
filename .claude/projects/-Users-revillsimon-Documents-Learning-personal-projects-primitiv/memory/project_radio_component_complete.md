---
name: radio-component-complete
description: Radio component set in Figma — 40 variants, radio/* tokens, State=unchecked/checked, no indeterminate
metadata:
  type: project
---

Radio set (401:17958) — **40 variants** (5 sizes × 2 states × 4 interactions) in the "Radio" section (401:17959) on the "Radio Group" page.

**Why:** Built fresh to replace the old set (319:1396) which had zero token bindings and wrong naming (dense/small/medium/large, selected/unselected). Needed before building the Dropdown component.

**How to apply:** Reference this set when building Dropdown radio items or any other component that embeds a radio indicator.

## Variant axes
- `Size`: xs · sm · md · lg · xl
- `State`: unchecked · checked (no indeterminate — Radio has only two states)
- `Interaction`: default · hover · focus · disabled

## Anatomy (per variant)
- Root FRAME: HORIZONTAL layout, FIXED sizing × 2, fully circular via `radio/{size}/box-radius`
- Focus ring frames (`focus-ring-gap` and `focus-ring`): ABSOLUTE, visible=true ONLY in Interaction=focus variants
- Dot FRAME (checked only): AUTO child centered by layout, bound to `radio/{size}/dot-size` / `radio/{size}/box-radius`

## Token namespace: `radio/*` in Context collection (25 vars)
All five sizes (xs–xl) each have:
- `radio/{size}/box-size` — aliases `size/size-*` Primitives (same values as `checkbox/{size}/box-size`)
- `radio/{size}/box-radius` — raw float = box-size/2 (ensures full circle; no matching Primitive)
- `radio/{size}/dot-size` — raw float = box-size/2 (50% indicator fill)
- `radio/{size}/focus-ring-gap-radius` — raw float = box-size/2 + 2
- `radio/{size}/focus-ring-radius` — raw float = box-size/2 + 4

## Colour token mapping
- Unchecked: fill=`surface/default`, border=`action/secondary/border/{interaction}`
- Checked: fill=`action/primary/{interaction}`, border=`action/primary/border/{interaction}`, dot=`action/primary/foreground/{default|disabled}`
- Focus rings: gap=`color/transparent`, ring=`focus/ring`, weight=`focus/ring/width`

## Arrange script
`apps/harmoni-figma-plugin/scripts/arrange-radio-component-set.js`
Grid: size rows (md first) × state × interaction cols; EDGE_PAD=24; re-run safe.
