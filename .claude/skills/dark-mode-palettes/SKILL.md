---
name: dark-mode-palettes
description: How harmoni generates dark-mode palettes (anchored two-segment lightness model) and the work deliberately deferred past v1. TRIGGER when working on dark palette generation, changing generate_dark_palette or generate_pair, asked why dark backgrounds stay dark for a pale brand, or revisiting a deferred dark-mode item. SKIP for light-only palette work and pure React work.
---

# Dark mode palettes

A dark palette is a **re-derivation, not a reversal** of the light
scale. Reversing the swatch array is wrong: every step has a fixed
semantic role (background → component bg → border → solid → text),
and the dark palette must keep each step in the same role. What is
preserved across modes is the roles and contrast relationships plus
the brand/solid step; the lightness values are independently tuned
for a dark substrate.

## The anchored two-segment model

`generate_dark_palette` (`crates/harmoni-core/src/palette/generator.rs`)
does **not** reuse the light palette's brand-relative offset model.
That model is fine for light palettes but, reused for dark mode, a
pale brand produces "dark" backgrounds that aren't actually dark.

Instead the dark scale is two interpolations joined at the brand:

- **Step 50** is pinned to `DARK_BG_ANCHOR` (absolute L `0.21`).
- **Step 900** is pinned to `DARK_TEXT_ANCHOR` (absolute L `0.94`).
- **Step 500** is the brand's exact lightness.
- Lower half (steps 50–500): interpolate `DARK_BG_ANCHOR → brand L`,
  shaped by the normalised `dark_curve`.
- Upper half (steps 500–900): interpolate `brand L → DARK_TEXT_ANCHOR`,
  shaped likewise.
- Step 500 is an explicit l/c/h passthrough so the brand is byte-
  identical, not routed through the gamut chroma calc.

`TARGET_LIGHTNESS_DARK` is the default *shape* reference — a
monotonic-ascending curve. Only its shape is consumed; the absolute
endpoints always come from the anchors. This guarantees reliably-dark
backgrounds however pale the brand is, a monotonic scale, and an
exactly-preserved brand.

The light palette's offset model is **untouched** — the anchored
model applies only to the dark path.

## API surface

- `generate_dark_palette(base_500, dark_curve, light_padding,
  dark_padding, soft_white, soft_black)` — core, returns a `Palette`.
  Padding is applied to the curve before the anchored model runs, so
  it reshapes the steps between the fixed 50/500/900 anchors.
- `generate_pair(input, light_curve, dark_curve, options)` — api,
  returns a `PaletteSet { light, dark }`. Light via the offset model,
  dark via the anchored model, from one brand colour.
- `PaletteSet` — re-exported from the crate root like `Palette`;
  mirrored in `harmoni-wasm` with the Tsify derives.
- `generate_palette_pair` — the wasm entry point the workbench uses
  for every regeneration, so light and dark never drift apart.

The contrast audit (`get_best_foreground`, six-tier rating) is reused
for the dark palette. Its harmonious-candidate scoring is order-
independent (`wcag_contrast`): a dark palette's step 900 is *lighter*
than its backgrounds, the opposite of a light palette, and the audit
must still recognise that real contrast rather than fall through to
pure white/black.

## Deferred work (not in v1)

These were consciously left out; revisit here before reopening them.

- **Cross-step / semantic-role contrast auditing** — the engine
  audits each swatch only against its own foreground. It does not
  check "step-900 text on a step-200 background". No warning is
  emitted for extreme brands; `note` stays `""`.
- **`TARGET_CHROMA_SCALE_DARK`** — dark-specific chroma shaping. v1
  reuses the light `TARGET_CHROMA_SCALE`.
- **Anchored model for the light palette** — would fix pale-brand
  washout there too, but regenerates every existing palette and test.
