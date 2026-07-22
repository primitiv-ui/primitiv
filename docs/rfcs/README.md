# Primitiv RFCs

Architecture decision records for Primitiv / Harmoni. Each RFC carries its own
status, summary, and decision record; this page is the index.

## Token & engine architecture

| # | Title | Status |
|---|---|---|
| [0001](0001-token-architecture.md) | Primitiv Token Architecture | Draft |
| [0002](0002-harmoni-to-intent-to-plugin.md) | Harmoni → Intent → Plugin | Phase B complete; Phase C in progress |
| [0003](0003-dynamic-foreground-wiring.md) | Dynamic foreground wiring | Implemented (engine + sync-plugin + DTCG) |
| [0017](0017-elevation-and-shadow-tokens.md) | Elevation & shadow tokens | Draft — in progress |

- **0001** — the six-pattern layered token stack (primitives → intent → role →
  anatomy → interaction → component), the contexts model, and the Button worked
  end to end.
- **0002** — wiring the Harmoni palette engine through the Intent layer into the
  Figma plugin.
- **0003** — letting the engine's computed, contrast-correct foreground flow all
  the way through instead of being replaced by a static guess.
- **0017** — elevation & shadow tokens: a two-tier system mirroring motion — a
  primitive `shadow.*` ramp (multi-layered box-shadows built with the
  smoothshadows methodology + 3 shared shadow colours) and a semantic
  `elevation.*` depth hierarchy (`flat / raised / overlay / floating / modal`).
  Adds a DTCG `shadow` composite to the emitter, reuses `space.*` for geometry so
  only 3 new COLOR variables hit Figma (geometry binds to existing space vars;
  effect styles are elevation's Figma form), and adopts it on Button (hover lift)
  + Switch (thumb). Applying the effect styles to existing Figma components — direct
  or behind a Boolean component property — is a documented follow-up session (§7).

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
| [0016](0016-spacing-and-flow-rhythm.md) | Spacing & flow rhythm | Implemented — no default margins; opt-in `.primitiv-flow` / `<Prose>` |

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

- **0016** — spacing & flow rhythm: a **counter-proposal** to the global
  block margins the `prose-base-styles` work landed in `primitiv.reset`
  (RFC 0008 D60). Argues inter-block rhythm should be owned by an opt-in *flow
  context* (`.primitiv-flow`), not by collapsing element margins — a
  one-directional owl (`> * + *`, `margin-block-start`) over a density-scoped
  `flow/*` scale, eliminating margin-collapse non-determinism and first/last
  bleed; element *typography* and inline marks stay in `reset` untouched. Ships
  two registry surfaces (the class + an `asChild` `<Prose>`); `gap` stays the
  tool for component-internal spacing.

Read **0004 → 0005 → 0006** in order; each builds on the one before. **0008**
constrains the *shape* of 0006's emitted CSS (layers + token scoping) and **0009**
the *mode scopes* it emits; both are read alongside 0006. **0007** is the
build/test strategy for 0005–0006 and applies once implementation starts.

## Input & tooling

| # | Title | Status |
|---|---|---|
| [0010](0010-oklch-color-picker.md) | OKLCH colour picker | Draft |
| [0011](0011-duotone-neutral-ramps.md) | Duotone neutral ramps | Implemented (engine + workbench UI) |
| [0013](0013-configurable-palette-export.md) | Configurable palette export (variables & canvas swatches) | Draft |

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
- **0013** — configurable palette export with **two outputs** from one
  serializable `ExportConfig`: **Figma variables** (choose the target collection +
  group location — browsed with MillerColumns / Tree — and a naming convention
  with a live preview; today's `Primitives / Palette` + `color/…` is the default
  preset) and **canvas swatches** (configure orientation, shape, gap, step
  labels, a11y contrast badges, … and generate the sheet onto the current page via
  a button or drag-and-drop). Pure `resolve` / `planSwatches` cores behind
  `VariableStore` / `CanvasRenderer` ports; built workbench-first with a live HTML
  preview. Works for the author and the end user alike.

## Figma library

| # | Title | Status |
|---|---|---|
| [0012](0012-figma-web-typography-build.md) | Figma web typography build | In progress |
| [0014](0014-figma-table-component.md) | Figma Table component build | Implemented |
| [0015](0015-figma-figure-figcaption-component.md) | Figma Figure + Figcaption component build | Accepted |

- **0012** — building the 27-element web typography library in Figma: text
  styles and components for every HTML prose element, covering all three
  density modes and bound to Intent tokens throughout. Records the conventions
  (inline font binding, fill binding, component naming), the decisions taken
  (D1 mono deferred, D2 strong=SemiBold, D3 em=synthetic slant, D4 visited
  token added, D6 Link 3×5×6 variants), and the build checklist status.
- **0014** — building the Figma **Table** (typography checklist #15, the one
  2-D prose component): a composed family (Cell · Header Cell · Row) plus a
  pre-composed top-level Table, sort as a Header-Cell variant axis, striping /
  borders / alignment / row-state treatments, and the new `table/*` Context
  (cell padding) and Intent (row-state fills) tokens. The build plan a future
  session executes.
- **0015** — building the Figma **Figure + Figcaption** (typography checklist
  #16): a Figcaption leaf set (Size × Align × Tone) + a composed top-level Figure
  (Size × Caption Position — below · above · overlay), the overlay position
  composing the Figcaption `Tone=overlay` variant (the `inverse` token pair), and
  one new `figure/caption-gap` Context token. Figma-only — there is no headless
  React `Figure`.

## React components

| # | Title | Status |
|---|---|---|
| [0019](0019-navigation-menu.md) | Navigation Menu (desktop dropdown + composed mobile) | Draft — proposed |

- **0019** — the docs-site primary nav as a headless **Navigation Menu**: keep
  the component focused on the desktop single-open dropdown nav, and build the
  mobile "menu open" sheet as a composition — `Drawer` + `Tree`/`Collapsible` +
  an active-state `Link` — sharing only a nav data model. Records the two
  presentations' state models, the fork (compose-mobile vs grow-one) and its
  sibling decisions, the desktop API sketch, and the build sequence (API sketch →
  TDD headless → Figma both → revisit → kitchen-sink both) for a follow-on
  session to execute.
