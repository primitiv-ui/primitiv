---
title: harmoni-core
---

# harmoni-core (Rust)

The pure-Rust palette engine. Adapters should program against
`harmoni_core::api` and never reach into the lower-level `audit`, `palette`, or
`neutral` modules directly — if `api` doesn't expose what you need, extend it
first.

## Colour input

All colour input goes through one enum — the single parsing path:

```rust
ColorInput::Css(String)                  // any CSS colour: #hex, oklch(...), rgb(...), named
ColorInput::Rgb { r: u8, g: u8, b: u8 }
ColorInput::Hsl { h: f32, s: f32, l: f32 }
ColorInput::Oklch { l: f32, c: f32, h: f32 }
```

Parsing failures surface as `ColorInputError`.

## Palette generation

```rust
api::generate(ColorInput) -> Result<Palette, ColorInputError>

api::generate_with_options(ColorInput, GenerateOptions)
    -> Result<Palette, ColorInputError>

api::generate_with_lightness(ColorInput, [f32; 10], GenerateOptions)
    -> Result<Palette, ColorInputError>

api::generate_pair(ColorInput, light_curve: &[f32; 10], dark_curve: &[f32; 10],
    GenerateOptions) -> Result<PaletteSet, ColorInputError>
```

`generate_pair` returns a `PaletteSet { light: Palette, dark: Palette }` built
from two lightness curves.

## Neutral / greyscale ramps

```rust
api::generate_neutral_ramp(white: ColorInput, black: ColorInput, TintMode,
    RampOptions) -> Result<Palette, ColorInputError>

api::derive_soft_neutrals(brand: ColorInput, softness: f32)
    -> Result<SoftNeutrals, ColorInputError>

api::tint_neutrals(white: ColorInput, black: ColorInput,
    source: ColorInput, strength: f32) -> Result<SoftNeutrals, ColorInputError>

api::tint_neutrals_duotone(white: ColorInput, black: ColorInput,
    highlight: ColorInput, shadow: ColorInput, strength: f32)
    -> Result<SoftNeutrals, ColorInputError>
```

`generate_neutral_ramp` interpolates a 10-step ramp between a soft white and
soft black along the perceptual lightness curve, interpolating hue shortest-arc
between the endpoints; `RampOptions { bow }` adds an optional mid-tone chroma
crest (`bow = 0` keeps chroma linear). `TintMode` is `Inherit` (mid-steps
inherit the endpoints' chroma) or `Achromatic` (chroma forced to zero).
`derive_soft_neutrals` produces soft black/white primitives from a brand colour;
`tint_neutrals` layers a brand hue onto already-chosen white/black while
preserving their lightness, and `tint_neutrals_duotone` does the same from two
independent anchors — a highlight governing the white end and a shadow the black
end (RFC 0011) — collapsing to `tint_neutrals` when the anchors coincide.

## Contrast audit

```rust
api::audit_contrast(bg: ColorInput, fg: ColorInput)
    -> Result<ContrastResult, ColorInputError>
```

`ContrastResult` carries `ratio: f32`, a `display_ratio: String`, and a
`rating: String` (`AAA` / `AA` / `Fail`).

## Key types

```rust
pub struct GenerateOptions {
    pub light_padding: f32,
    pub dark_padding: f32,
    pub soft_white: Option<Oklch>, // replaces pure white as a foreground candidate
    pub soft_black: Option<Oklch>, // replaces pure black as a foreground candidate
}

pub struct PaletteSet { pub light: Palette, pub dark: Palette }
```

A **`Palette`** is a struct — ten `Swatch`es plus the `lightness_curve` and
padding / `note` metadata used to build them. Each **`Swatch`** carries its
OkLCH components, `hex`, `rgb`, a label, and its best foreground choice together
with the foreground source and contrast result.

Output helpers in `harmoni_core::color::output` convert OkLCH to other forms:

```rust
oklch_to_hex(Oklch) -> String
oklch_to_rgb(Oklch) -> Rgb            // components in 0.0..=1.0
format_oklch(Oklch) -> String         // CSS "oklch(L C H)"
```

## Building & testing

```sh
cargo test --workspace
```

See [harmoni-wasm](/harmoni/wasm) for the browser-facing API.
