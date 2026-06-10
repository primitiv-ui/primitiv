---
name: harmoni-architecture-history
description: Historical reference for the settled shape of the harmoni palette engine — Steps C/D/A/B, ColorInput, the harmoni-core/harmoni-wasm boundary, mirror types, the Swatch/Palette vocabulary, and the neutral colour module. TRIGGER when working in crates/harmoni-core or crates/harmoni-wasm and needing the why behind the api module boundary, the zero-wasm-deps rule, the canonical color form, mirror types, or the neutral ramp / soft-neutral / tint functions. SKIP for any pure React work.
---

# Harmoni architecture history

Historical reference, not steering for new work. Four refactoring steps were
executed in order C → D → A → B (PRs #1 and #2), followed by a vocabulary
rename and the neutral module.

Reference files — load the one you need:

- `references/refactoring-steps.md` — full narrative of Steps C/D/A/B, the
  vocabulary rename, and Palette's promotion from type alias to struct.
- `references/neutral-module.md` — the neutral module (derive / ramp / tint),
  the six-tier foreground audit, `ForegroundSource`, and the wasm mirror
  types it added.

## The settled rules (the part most sessions need)

- **One parsing path.** `ColorInput` (`crates/harmoni-core/src/color/input.rs`)
  is the only way to hand colours to the engine — variants `Css` / `Rgb` /
  `Hsl` / `Oklch`, all normalising to `palette::Oklch`, the internal
  canonical form. `Css` covers anything `csscolorparser` accepts.
- **Adapters import from `harmoni_core::api` only** — never lower-level
  modules, never the `palette` crate directly. The `api::generate`
  module-and-function name collision is intentional (same pattern as
  `std::mem::size_of`).
- **`harmoni-core` is pure Rust** — exactly three direct deps:
  `csscolorparser`, `palette`, `serde`. All Tsify/wasm-bindgen code lives in
  `crates/harmoni-wasm/src/types.rs` as mirror types with
  `From<harmoni_core::*>` conversions at the boundary.
- **Vocabulary:** `SwatchStep` (one colour point), `SwatchLabel` (numeric or
  named), `Swatch` (one scale item with foreground + contrast metadata),
  `Palette` (a **struct**: `swatches` + `lightness_curve` +
  `max_recommended_*_padding` + `note` — not a `Vec<Swatch>` alias).
- **Primitiv vs Harmoni:** everything Rust/tooling/JS-TS says `harmoni`
  except the deliberate product-name references (README heading,
  `package.json` name, workbench title/`<h1>`). Renaming those erodes the
  identity split — stop.
- **The `neutral` module** supersedes the old `generate_greyscale` —
  `derive_soft_neutrals`, `generate_neutral_ramp`, `tint_neutrals`, all
  wrapped in `api::*` taking `ColorInput`.

## API surface at a glance

The settled public shape, as UML. Source lives in the crate root —
`crates/harmoni-core/api-surface.mmd` (entry points + inputs) and
`crates/harmoni-core/data-model.mmd` (the data model below). Same
capabilities reach Rust adapters via `harmoni_core::api` and TS/JS via
the `harmoni_wasm` `#[wasm_bindgen]` wrapper.

```mermaid
classDiagram
    direction TB
    class PaletteSet {
        +Palette light
        +Palette dark
    }
    class Palette {
        +Curve lightness_curve
        +f32 max_recommended_light_padding
        +f32 max_recommended_dark_padding
        +String note
    }
    class Swatch {
        +f32 l
        +f32 c
        +f32 h
        +SwatchLabel label
        +String hex
        +Rgb rgb
        +String oklch
        +SwatchStep best_foreground
        +ForegroundSource foreground_source
        +ContrastResult contrast_result
    }
    class SwatchStep {
        +f32 l
        +f32 c
        +f32 h
        +SwatchLabel label
        +String hex
        +Rgb rgb
        +String oklch
    }
    class SwatchLabel {
        <<enumeration>>
        Number
        Name
    }
    class ForegroundSource {
        <<enumeration>>
        Step900
        Step50
        SoftWhite
        SoftBlack
        PureWhite
        PureBlack
    }
    class ContrastResult {
        +f32 ratio
        +String display_ratio
        +String rating
    }
    class Rgb {
        +f32 r
        +f32 g
        +f32 b
    }
    class SoftNeutrals {
        +Oklch white
        +Oklch black
    }
    PaletteSet o-- "2" Palette
    Palette *-- "10" Swatch : swatches
    Swatch *-- SwatchStep : best_foreground
    Swatch --> ForegroundSource : foreground_source
    Swatch --> ContrastResult
    Swatch --> Rgb
    Swatch --> SwatchLabel
    SwatchStep --> Rgb
    SwatchStep --> SwatchLabel
```
