# Primitiv RFCs

Architecture decision records for Primitiv / Harmoni. Each RFC carries its own
status, summary, and decision record; this page is the index.

## Token & engine architecture

| # | Title | Status |
|---|---|---|
| [0001](0001-token-architecture.md) | Primitiv Token Architecture | Draft |
| [0002](0002-harmoni-to-intent-to-plugin.md) | Harmoni → Intent → Plugin | Phase B complete; Phase C in progress |
| [0003](0003-dynamic-foreground-wiring.md) | Dynamic foreground wiring | Implemented (engine + sync-plugin + DTCG) |

- **0001** — the six-pattern layered token stack (primitives → intent → role →
  anatomy → interaction → component), the contexts model, and the Button worked
  end to end.
- **0002** — wiring the Harmoni palette engine through the Intent layer into the
  Figma plugin.
- **0003** — letting the engine's computed, contrast-correct foreground flow all
  the way through instead of being replaced by a static guess.

## Consumption layer

How consumers (human and agent) install and configure Primitiv. Settled across
the 2026-06-09 design discussion; the narrative and the full D1–D25 decision log
live in [`../consumption-design.md`](../consumption-design.md).

| # | Title | Status |
|---|---|---|
| [0004](0004-consumption-distribution-and-styling-contract.md) | Consumption distribution model & styling contract | Draft |
| [0005](0005-primitiv-cli.md) | The Primitiv CLI | Draft |
| [0006](0006-token-and-style-pipeline.md) | Token & style pipeline | Draft |
| [0007](0007-cli-development-and-test-strategy.md) | CLI development & test strategy | Draft |
| [0008](0008-css-architecture-cascade-layers-and-token-scoping.md) | CSS architecture: cascade layers & token scoping | Draft |
| [0009](0009-mode-scoping-theme-and-density.md) | Mode scoping: theme & density as inheritable attributes | Draft |

- **0004** — the foundation: the hybrid model (versioned headless packages +
  opt-in copy-in styles) and the four-part styling contract (root class +
  modifier classes + `data-*` state + `--primitiv-*` custom-property API).
- **0005** — the `primitiv` Rust CLI: commands, `primitiv.json`, the safe `add`
  flow, the static registry, distribution, and the pnpm/npm/yarn/bun invocation
  cookbook.
- **0006** — one Rust emitter → the three cascade-based token formats (CSS /
  SCSS / Tailwind; the planned TS/JS format was dropped, D50), light theme +
  evolvable dark tokens, and the Figma-sourced default theme authored in the
  workbench.
- **0007** — how the CLI is built test-first: ports & adapters (pure core, faked
  effects), the test pyramid, hand-authored golden files, 100% coverage, and
  Rust entering CI.
- **0008** — the CSS architecture beneath the contract: one `@layer primitiv`
  with an ordered sublayer stack (so consumer CSS always wins and state beats
  variant), no `!important`, and the two-tier token split that lets a partial
  install carry only the components it added.
- **0009** — mode scoping: theme and density as two orthogonal, inheritable
  `data-*` attributes (`data-theme`, `data-density`), reproducing Figma's
  page/frame/child inheritance on the web, working across the cascade-based
  formats, with responsive (container-query) density designed-in as a deferred
  follow-on.

Read **0004 → 0005 → 0006** in order; each builds on the one before. **0008**
constrains the *shape* of 0006's emitted CSS (layers + token scoping) and **0009**
the *mode scopes* it emits; both are read alongside 0006. **0007** is the
build/test strategy for 0005–0006 and applies once implementation starts.

## Input & tooling

| # | Title | Status |
|---|---|---|
| [0010](0010-oklch-color-picker.md) | OKLCH colour picker | Draft |
| [0011](0011-duotone-neutral-ramps.md) | Duotone neutral ramps | Draft |
| [0012](0012-spacing-and-flow-rhythm.md) | Spacing & flow rhythm | Draft — model settled; scale values open |

- **0010** — the OKLCH-first, oklch.com-style colour picker that replaces the
  hex input: paint-backed Lightness×Chroma and Hue charts with a live gamut
  boundary, rendered from a new Rust/wasm gamut API (one colour engine, no JS
  twin), shipped sRGB-first with Display-P3 as a fast-follow, built in the
  workbench then ported to the plugin.
- **0011** — duotone neutral ramps: two tint anchors (a highlight governing the
  light end, a shadow governing the dark end) with shortest-arc hue + optional
  mid-tone chroma-bow interpolation across the scale, generalising the
  single-hue neutral tint (which becomes the equal-hue, zero-bow special case).
  Adopts Leonardo's perceptual key-colour interpolation, constrained to the
  two-anchor neutral case.
- **0012** — spacing & flow rhythm: margins between content blocks are owned by
  an ambient, opt-in *flow context* (`.primitiv-flow`), not by the elements —
  the architectural sibling of `data-density`. A one-directional owl rule
  (`> * + *`, `margin-block-start`) drives a density-scoped `flow/*` token scale
  so rhythm densifies in lockstep with type and control anatomy; `gap` stays the
  tool for component-internal spacing. Ships two surfaces — the `.primitiv-flow`
  class and a `<Prose>` component. Model settled (D51–D62); only the flow-scale
  step count + per-density values stay open, pending layout validation.
