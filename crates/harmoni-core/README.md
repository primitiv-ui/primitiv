# harmoni-core

**Harmoni** is the palette-generation engine that powers
[Primitiv](../../README.md). `harmoni-core` is its pure-Rust heart: it
generates perceptually-uniform colour palettes and audits contrast, and
knows nothing about JavaScript, TypeScript, or any adapter.

It has three direct dependencies (`csscolorparser`, `palette`, `serde`) and
is intended to be portable — the same engine can back a wasm browser
runtime, a CLI, or future native bindings. The wasm adapter lives in the
sibling [`harmoni-wasm`](../harmoni-wasm) crate, which is the only place
`wasm-bindgen` / `tsify` live; it holds mirror types that shadow these
structs and convert at the boundary via `From<harmoni_core::*>`.

## Engine surface

Adapters should program against `harmoni_core::api`, never the lower-level
modules (`audit`, `palette::generator`, …). If an adapter needs something
`api` doesn't expose, extend `api` first. The curated surface is small by
design:

```rust
// Palette generation
api::generate(ColorInput) -> Result<Palette, ColorInputError>
api::generate_with_options(ColorInput, GenerateOptions)
    -> Result<Palette, ColorInputError>
api::generate_with_lightness(ColorInput, [f32; 10], GenerateOptions)
    -> Result<Palette, ColorInputError>

// Neutral / greyscale ramps
api::generate_neutral_ramp(white: ColorInput, black: ColorInput, TintMode)
    -> Result<Palette, ColorInputError>
api::derive_soft_neutrals(brand: ColorInput, softness: f32)
    -> Result<SoftNeutrals, ColorInputError>
api::tint_neutrals(white: ColorInput, black: ColorInput,
    source: ColorInput, strength: f32)
    -> Result<SoftNeutrals, ColorInputError>

// Contrast audit
api::audit_contrast(ColorInput, ColorInput)
    -> Result<ContrastResult, ColorInputError>
```

A `Palette` is a struct — ten `Swatch`es plus the `lightness_curve` and
padding / `note` metadata used to build them.

`GenerateOptions` carries `light_padding` / `dark_padding` plus optional
`soft_white` / `soft_black` overrides — when set, those replace pure
black/white as foreground-audit candidates.

The neutral surface builds greyscale ramps. `generate_neutral_ramp`
interpolates a 10-step ramp between a soft white and soft black along the
perceptual lightness curve; `TintMode` is `Inherit` (mid-steps inherit the
endpoints' chroma) or `Achromatic` (chroma forced to zero).
`derive_soft_neutrals` produces soft black/white primitives from a brand
colour, and `tint_neutrals` layers a brand hue onto already-chosen
white/black while preserving their lightness.

## Colour input

All colour input goes through the `ColorInput` enum — the single parsing
path:

```rust
ColorInput::Css(String)              // any CSS colour: #hex, oklch(...), rgb(...), named
ColorInput::Rgb { r: u8, g: u8, b: u8 }
ColorInput::Hsl { h: f32, s: f32, l: f32 }
ColorInput::Oklch { l: f32, c: f32, h: f32 }
```

Internally, everything is normalised to OkLCH via the `palette` crate.
OkLCH is perceptually uniform, which is what makes the lightness scale and
chroma interpolation feel consistent across hues. Contrast ratios use the
standard WCAG 2.1 relative-luminance formula (`AAA ≥ 7.0`, `AA ≥ 4.5`).

## Tests

```sh
cargo test -p harmoni-core
```

Coverage is held at 100% (lines, regions, functions). See the
`rust-wasm-workflow` skill for the core ↔ wasm boundary conventions.
