# Primitiv

**Primitiv** is a design system. **Harmoni** is the palette generation engine that powers it.

This repo is a monorepo that houses both: the Rust engine (`harmoni-core`),
the WebAssembly adapter that exposes it to the browser (`harmoni-wasm`),
the React app used to develop and visualise palettes during iteration
(`apps/web`), and the Figma plugin that will let designers pull Primitiv
palettes directly into their Figma files (`apps/harmoni-figma-plugin`).

## Repo layout

```
primitiv/
├── Cargo.toml                 # Rust workspace
├── pnpm-workspace.yaml        # pnpm workspace
├── crates/
│   ├── harmoni-core/          # Pure-Rust palette generation + contrast audit
│   └── harmoni-wasm/          # wasm-bindgen adapter; consumed by apps/web
├── packages/
│   ├── react/                 # Headless React component library
│   └── icons/                 # Fill-based SVG icon library
└── apps/
    ├── web/                   # React dev surface (Vite + TS)
    └── harmoni-figma-plugin/  # Figma plugin (Vite + TS + React)
```

- `harmoni-core` is pure Rust. It has three direct dependencies
  (`csscolorparser`, `palette`, `serde`) and knows nothing about
  JavaScript, TypeScript, or any adapter. It is intended to be
  portable: the same engine can back a wasm browser runtime, a CLI,
  or future native bindings.
- `harmoni-wasm` is the only place `wasm-bindgen` and `tsify` live.
  It holds mirror types that shadow the core structs, derive the
  Tsify TypeScript/ABI machinery, and convert at the boundary via
  `From<harmoni_core::*>`. Adapters for non-wasm runtimes would
  live as sibling crates alongside it.
- `packages/react` is a headless, accessible React component
  library with zero styles. See the [React package README](packages/react/README.md).
- `apps/web` is a small React app used for visual iteration on the
  palette algorithm. It is **not** a production surface for the
  design system — think of it as a workbench.
- `apps/harmoni-figma-plugin` is the Harmoni Figma plugin. It is
  currently scaffolded — UI/sandbox build plumbing, the harmoni-wasm
  engine seam, and a test suite — ahead of building palette features.
  See the [plugin README](apps/harmoni-figma-plugin/README.md).

## Engine surface

Adapters should program against `harmoni_core::api`, never the
lower-level modules. The curated surface is small by design:

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

A `Palette` is a struct — ten `Swatch`es plus the
`lightness_curve` and padding / `note` metadata used to build them.

`GenerateOptions` carries `light_padding` / `dark_padding` plus
optional `soft_white` / `soft_black` overrides — when set, those
replace pure black/white as foreground-audit candidates.

The neutral surface builds greyscale ramps. `generate_neutral_ramp`
interpolates a 10-step ramp between a soft white and soft black
along the perceptual lightness curve; `TintMode` is `Inherit`
(mid-steps inherit the endpoints' chroma) or `Achromatic` (chroma
forced to zero). `derive_soft_neutrals` produces soft black/white
primitives from a brand colour, and `tint_neutrals` layers a brand
hue onto already-chosen white/black while preserving their
lightness.

All colour input goes through the `ColorInput` enum, which is the
single parsing path:

```rust
ColorInput::Css(String)              // any CSS colour: #hex, oklch(...), rgb(...), named
ColorInput::Rgb { r: u8, g: u8, b: u8 }
ColorInput::Hsl { h: f32, s: f32, l: f32 }
ColorInput::Oklch { l: f32, c: f32, h: f32 }
```

Internally, everything is normalised to OkLCH via the `palette`
crate. OkLCH is perceptually uniform, which is what makes the
lightness scale and chroma interpolation feel consistent across
hues. Contrast ratios use the standard WCAG 2.1 relative luminance
formula (`AAA ≥ 7.0`, `AA ≥ 4.5`).

## Components

`packages/react` exports headless, accessible React components built on
the WAI-ARIA authoring patterns. They ship with zero styles — style them with
whatever system you use (CSS, Tailwind, CSS-in-JS, design tokens, etc.).

See [`packages/react`](packages/react/README.md) for the full
component index and per-component documentation. Planned components
and outstanding workbench examples are tracked in [`ROADMAP.md`](ROADMAP.md).

## Getting started

Prerequisites:

- Rust (stable)
- Node 20+ and pnpm 10
- [`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/)
  (only required to rebuild the wasm package for the web app)

Install dependencies and run the Rust test suite:

```sh
pnpm install
cargo test --workspace
```

Rebuild the wasm package and start the web dev server:

```sh
pnpm run build:wasm
pnpm run dev
```

`pnpm run build:wasm` regenerates `crates/harmoni-wasm/pkg/`,
which is what `apps/web` consumes via a pnpm workspace link. The
`pkg/` directory is not tracked in git; it is always rebuilt
from source.

## Development expectations

- **Strict TDD.** New behaviour is driven by a failing test
  first (red → green → refactor). Pure red-green — no
  characterisation tests that pass the moment you write them.
  Existing tests must stay green throughout any refactor.
- **Small commits.** One per red-green(-refactor) cycle. Each
  commit should leave the tree green and describe its own intent.
- **Push often.** "Push little and often" — land work in
  short-lived branches via PRs rather than accumulating large
  unshared histories.
- **Adapters program against `harmoni_core::api`.** Do not reach
  into `harmoni_core::audit`, `harmoni_core::palette::generator`,
  or the `palette` crate directly. If the adapter needs something
  the `api` module doesn't expose, extend the `api` module first.

## License

TBD.
