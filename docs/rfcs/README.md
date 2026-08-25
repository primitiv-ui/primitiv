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
| [0025](0025-responsive-breakpoints.md) | Responsive breakpoints | Web landed; Figma sync pending |
| [0027](0027-ramp-quality-and-generation-feedback.md) | Ramp quality metrics & generation feedback | Steps 1–3 landed; 4–7 open |

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
- **0025** — responsive breakpoints: a six-tier, mobile-first `min-width`
  scale (`xs`/360 → `2xl`/1536), emitted in `rem` at the same 16px base every
  other length token uses. `xs` is additive over Tailwind's default 5-tier
  scale, anchored to the current dominant small-Android viewport width rather
  than the older 375px default; the Tailwind `@theme` output deliberately
  omits `sm`–`2xl` (they match Tailwind v4's own defaults, so redeclaring them
  risks clobbering a consumer's customization) and emits only the additive
  `xs`. Directly unblocks RFC 0022's deferred `Container`/`Grid`
  responsiveness. Ships the public `useMediaQuery` hook (the first public hook
  in `@primitiv-ui/react`) and a generated `breakpoints.ts` companion for it.
  **Web side landed (2026-08-08); Figma variables and the §3 design-frame
  presets are still pending** — see `docs/transfer-and-next-steps.md`.
- **0027** — ramp quality metrics: Harmoni generates palettes and nothing knows
  whether they are good. The engine is rigorous about per-swatch foreground
  contrast (zero failures across 100 swatches) but measures nothing about the
  *ramp* — hue stability, step spacing, or how much of the available chroma it
  uses. A throwaway audit example caught a chroma regression that had sat in
  `main` since RFC 0010, where tightening `linear_in_gamut` for the picker's Hue
  chart also cost the palette generator up to 41% of its light-end chroma.
  Proposes a `RampQuality` type in `harmoni-core::audit`, measuring chroma
  against **what the gamut allows** rather than a committed baseline, consumed by
  regression tests, the CI report, and — the most valuable part — the picker UI,
  so a designer learns at pick time that their cyan will mute in sRGB rather than
  months later. Also proposes extending the foreground API from "text on this
  fill" to "which step is readable on this surface", which is the structural fix
  for the three contrast failures in `docs/interface-audit.md`.
  **Steps 1–7 landed (2026-08-20/21)**: `assess()` in `harmoni-core::audit`,
  regression tests gating every shipped seed, and the `ramp-audit` example
  rewired onto the engine. Building it corrected the RFC's own diagnosis — the
  generator does **not** share the picker's gamut search; its private copy
  returns the constant `0.4` at every lightness, so chroma has never been
  gamut-aware and the light end has always demanded colour that does not exist
  (`warning/200` asks for 14.9×). Chroma is consequently measured twice, demanded
  and rendered, the way hue already was. Step 4 then capped chroma **in OkLCH at
  constant lightness and hue** instead of letting per-channel clipping absorb it,
  which collapsed rendered hue drift from 33.4°/31.2° to under 6° on every ramp
  and unlocked a hue-span gate the RFC could not write. **Step 5 (regenerate) is
  blocked**: the fix unmasked a second defect — the light palette *shifts* its
  lightness curve where the dark palette *anchors* it, so any seed lighter than
  ~0.60 collides steps at the 0.99 ceiling (`warning` renders three identical
  near-whites). See the RFC's §11 and §12.

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
| [0020](0020-agent-manifest-and-mcp-server.md) | Agent manifest & MCP server | Draft |

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

- **0020** — agent manifest & MCP server: prompted by Meta's Astryx (an
  open-source design system built ground-up to be machine-readable via a
  JSON manifest + MCP server). Proposes a config-less `primitiv manifest
  [--json]` command that aggregates the command surface, the full registry
  index with contracts inlined, and the token format matrix into one
  versioned artifact; real JSON Schema files for `contract.json` /
  `primitiv.json` / `registry.json` (their `$schema` URLs don't resolve to
  anything today); and an MCP server as a thin transport over the existing
  CLI core exposing `list_components` / `get_contract` / `get_manifest` /
  `get_tokens` / `add_component` as typed tools. Follows through on the
  "(future) an MCP server" stub in RFC 0005 §6.5. Codemods and any schema
  redesign are explicitly out of scope.

Read **0004 → 0005 → 0006** in order; each builds on the one before. **0008**
constrains the *shape* of 0006's emitted CSS (layers + token scoping) and **0009**
the *mode scopes* it emits; both are read alongside 0006. **0007** is the
build/test strategy for 0005–0006 and applies once implementation starts.
**0020** aggregates what 0004–0006 already produce into one agent-facing
surface and applies once those are read.

## Input & tooling

| # | Title | Status |
|---|---|---|
| [0010](0010-oklch-color-picker.md) | OKLCH colour picker | Draft |
| [0011](0011-duotone-neutral-ramps.md) | Duotone neutral ramps | Implemented (engine + workbench UI) |
| [0013](0013-configurable-palette-export.md) | Configurable palette export (variables & canvas swatches) | Draft |
| [0028](0028-harmoni-plugin-architecture.md) | Harmoni plugin: build architecture & test strategy | Draft — domain settled, spikes defined |

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
  with a live preview; today's `Primitives / Palette` + `color/...` is the default
  preset) and **canvas swatches** (configure orientation, shape, gap, step
  labels, a11y contrast badges, ... and generate the sheet onto the current page via
  a button or drag-and-drop). Pure `resolve` / `planSwatches` cores behind
  `VariableStore` / `CanvasRenderer` ports; built workbench-first with a live HTML
  preview. Works for the author and the end user alike.
- **0028** — how the Harmoni Figma plugin gets built, now that the v3 design phase
  is complete: the domain core lives in the UI iframe and `code.ts` is demoted to
  a driven adapter executing plans the core computes (plan-shaped port verbs, not
  per-node CRUD); a four-layer test strategy with mutation gated at the domain and
  application layers only; Playwright ATDD driving the real UI against an in-page
  fake Figma, kept honest by a contract suite that also runs inside the real
  sandbox. Defines the two spikes that must run first — the (fully scriptable)
  undo probe and the in-sandbox contract runner — and records the repo/licence
  position, including the measurement that the whole public-CLI → engine coupling
  is one function call. §7 settles the domain model — one `reconcile(desired,
  actual)` behind all four ownership verbs, a two-level stamp whose `origin` field
  is what keeps the ownership promise across adopt, and seven invariants to drive
  from tests — and §7.8 records the contradiction the modelling surfaced: the
  plugin writes into two collections while `Destination` picks one.

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
| [0021](0021-composite-components.md) | Composite components | Draft — proposed |
| [0022](0022-layout-primitives.md) | Layout primitives | Draft — proposed |
| [0023](0023-prose-content-components.md) | Prose & content components | Draft — proposed |
| [0024](0024-app-shell-and-marketing-patterns.md) | App-shell & marketing patterns | Draft — exploratory |

- **0019** — the docs-site primary nav as a headless **Navigation Menu**: keep
  the component focused on the desktop single-open dropdown nav, and build the
  mobile "menu open" sheet as a composition — `Drawer` + `Tree`/`Collapsible` +
  an active-state `Link` — sharing only a nav data model. Records the two
  presentations' state models, the fork (compose-mobile vs grow-one) and its
  sibling decisions, the desktop API sketch, and the build sequence (API sketch →
  TDD headless → Figma both → revisit → kitchen-sink both) for a follow-on
  session to execute.
- **0021** — the next roadmap phase now that the primitive layer is nearly
  complete: **composite components**, registry-only surfaces built by
  composing ≥2 existing primitives with no new ARIA pattern (Confirm Dialog =
  `Modal` + `Button`; Data Table = `Table` + `Checkbox` + `Dropdown` + `Select`
  + `Pagination`; Card, Avatar Group, Stepper, Toast, Command Palette, Date
  Picker, ...). Defines the selection criteria, a three-tier candidate list
  (buildable now / needs one small shared extraction / blocked on a
  primitive-backlog item), what got filtered out for needing genuine new ARIA
  (Toolbar, Menubar, Splitter, QR Code), and a suggested build order starting
  with the cheapest end-to-end proof (a Breadcrumb overflow menu).
- **0022** — the structural gap behind every other proposal: **layout
  primitives** (`Box`, `Stack`, `Spacer`, `Center`, `AspectRatio`,
  `Container`, `Grid`), all hand-authored/primitive-less like `prose`. Flags
  the one open decision — `Container`/`Grid` want viewport responsiveness,
  but no breakpoint token scale exists yet (RFC 0009 §5 designed but
  deferred the same container-query mechanism) — and recommends shipping
  non-responsive in v1 rather than solving that unilaterally. A hard
  prerequisite for RFC 0024.
- **0023** — **prose & content components**: crossing List, DescriptionList,
  Blockquote, Pull Quote, and Kbd from Figma-only (RFC 0012) into React +
  registry, the same way Table already did (RFC 0014). Unusually low-risk —
  every token binding and Figma variant already exists, so this is a pure
  code build against an already-paid-for design. Also proposes a
  registry-only Figure/Figcaption wrapper, explicitly *not* reopening RFC
  0015's "no headless React Figure" decision.
- **0024** — **app-shell & marketing patterns** (Page Header, Error/Empty
  page shell, app-shell/sidebar layout, Hero, Footer). Deliberately lighter
  than 0021/0023: unlike those, none of these have existing Figma design, so
  this is a scoped candidate list awaiting a design session, not a build
  plan. Flags Hero/Footer as content-shaped rather than component-shaped,
  and recommends Page Header + Error/Empty page shell as the strongest,
  most build-ready starting point if the category gets picked up.

## Evaluation & consumer testing

| # | Title | Status |
|---|---|---|
| [0026](0026-consumer-testing-with-agent-personas.md) | Consumer testing with agent personas | First cycle complete — re-run scoped |

- **0026** — an outside-in usability program: AI agents role-play distinct
  consumer profiles (greenfield + full styled registry, brownfield headless
  inside an existing design system, Tailwind-powered) against one shared
  three-page-showcase brief, at a pinned Primitiv version, using only the
  published CLI/npm/JSR surface — never this repo's own source or
  `CLAUDE.md`. Critiques the "showcase all components" instruction (coverage
  is a property of the whole program, not one site), flags that Profile B
  needs a real brownfield fixture or the brownfield signal is lost, argues
  for running now rather than waiting on the roadmap (missing components are
  themselves the signal), and for running now despite Container/Grid/
  breakpoints not existing (RFC 0022 §4 / 0025) — treating the hand-rolled
  layout workaround as the expected, most valuable finding of the first run,
  as long as it's logged rather than left to swamp everything else. Requires
  a real environment separated from this repo (no `CLAUDE.md`, no
  workspace-source-aliased packages like `apps/kitchen-sink` uses) and an
  independent, browser-verified reviewer pass rather than trusting the
  building agent's self-report.
