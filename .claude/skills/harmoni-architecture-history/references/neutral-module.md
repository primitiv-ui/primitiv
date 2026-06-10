# The neutral colour module

A `neutral` module gives `harmoni-core` first-class greyscale /
neutral ramps. Landed across PRs #56–#58.

`crates/harmoni-core/src/neutral/` has three parts:

- `derive::derive_soft_neutrals(brand, softness)` → `SoftNeutrals`
  — soft black/white primitives derived from a brand colour. The
  softness factor (clamped `[0, 1]`) controls how far the endpoints
  pull off pure white/black and how much brand tint they carry.
- `ramp::generate_neutral_ramp(white, black, TintMode)` → `Palette`
  — a 10-step ramp interpolated between the two endpoints along the
  normalised perceptual lightness curve. `TintMode::Inherit` lets the
  mid-steps inherit the endpoints' chroma; `TintMode::Achromatic`
  forces chroma to 0 at every step.
- `tint::tint_neutrals(white, black, source, strength)` →
  `SoftNeutrals` — layers `source`'s hue onto already-chosen white
  and black, **keeping their lightness**. This is the
  layer-a-tint-onto-my-tones operation; it does not derive new
  lightnesses the way `derive_soft_neutrals` does.

`SoftNeutrals { white, black }` (a pair of `palette::Oklch`) and
`TintMode` are re-exported from the crate root. The `api` wrappers
(`api::generate_neutral_ramp`, `api::derive_soft_neutrals`,
`api::tint_neutrals`) take `ColorInput`.

The standalone `generate_greyscale_oklch` / `api::generate_greyscale`
from Step D was **removed** — the `neutral` module supersedes it.

## Foreground audit + GenerateOptions

`GenerateOptions` gained `soft_white` / `soft_black`
(`Option<Oklch>`): when set they replace pure white/black as
foreground-audit candidates, so a brand palette can use the design
system's soft primitives.

`get_best_foreground` became a six-tier audit, in preference order:
harmonious dark (step 900) → harmonious light (step 50) → soft white
→ soft black → pure white → pure black. Pure white/black are always
evaluated last and mathematically guarantee an AA-passing result for
any sRGB background.

## wasm mirror types added

`types.rs` gained `TintMode`, `SoftNeutrals`, and `OklchTriple`.
`OklchTriple` is a wasm-only `{ l, c, h }` flattening — the wasm
crate can't expose `palette::Oklch` directly. `TintMode` has `From`
impls in *both* directions because it is passed into the engine, not
just returned.

## Foreground source discriminant (RFC 0003)

`get_best_foreground` now also returns a `ForegroundSource` enum
(`Step900 · Step50 · SoftWhite · SoftBlack · PureWhite · PureBlack`)
naming which of the six tiers won — it replaced the old
`is_harmonious` bool. Every `Swatch` carries it as `foreground_source`
alongside the resolved `best_foreground`, so a consumer can re-express
the choice as a token alias (the ramp's own 50/900, or a white/black
anchor) rather than a baked colour. Mirrored on the wasm `Swatch`.
