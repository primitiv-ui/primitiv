# WIP — CLI/registry parity for prose & inline-mark typography

Continuation note for the `prose-base-styles` branch. Pairs with the Figma work
that landed the inline marks (PR #206) and the master checklist in
`docs/figma-typography-checklist.html` (items 18–27 Done).

## Goal

Bring the CLI / registry / emitted CSS to parity with the prose components and
typographic marks built in Figma.

## Decisions locked (this session)

1. **Global element styles, not classes.** The inline marks + base block prose
   are styled via **bare element selectors** (`strong`, `em`, `p`, `blockquote`,
   …), not opt-in classes. Rationale: they're the most basic semantic elements;
   placing them in the cascade's lowest layer means a consumer overrides any of
   them at near-zero cost. This is a deliberate exception to RFC 0008's
   "no global reset" stance (D49) — **document the reversal in RFC 0008 §7**.
2. **Layer = `primitiv.reset`** (the reserved lowest sublayer). Lowest precedence
   ⇒ component classes and consumer rules both win trivially.
3. **Scope for this branch:** the base element layer **plus** styled **Table** and
   **Divider** registry entries (both already exist headless in
   `@primitiv-ui/react` — no new React TDD needed).
4. **Distribution:** ship the base element stylesheet as part of the foundation
   (emitted/written by `tokens` / `init`), so it's "part of the main styles"
   rather than an opt-in `add`. (Alternative considered: a `prose` registry entry
   installed via `add` — lighter CLI change; flip to this if foundation-shipping
   proves heavy.)

## State of the world (verified this session)

- **Tokens already flow.** The emitter embeds `packages/tokens/src/*.json` via
  `include_str!`, so the new `highlight/background` (Intent) token is already
  emitted by the CLI for consumers. Only the **committed convenience copy**
  `apps/workbench/src/primitiv-tokens.css` is stale (missing both
  `--primitiv-highlight-background` and `--primitiv-font-family-mono`) — regen it
  with the CLI (`cargo run -p primitiv-cli -- tokens --out apps/workbench/src/primitiv-tokens.css`).
- **No base/element stylesheet exists** — the emitter and all 8 registry
  components use class selectors only; `primitiv.reset` was reserved + empty.
- **Registry = 8 controls, zero prose** (button, checkbox, field, input,
  input-group, radio, switch, tabs). Anatomy per component:
  `contract.json → <name>.recipe.ts (cva) → <name>.tsx (imports @primitiv-ui/react)
  → styles.css/.scss`. Indexed in `registry/registry.json` + `include_str!`'d in
  `crates/primitiv-cli/src/ports/registry.rs`.
- **Headless prose that already exists:** `Table` (structural slots only — Root,
  Head, Body, Footer, Row, Cell, Header, Caption, ScrollArea; no sort/state) and
  `Divider` (`<span role="separator">`, `orientation` prop). Everything else
  prose is absent; the inline marks need no headless component (pure CSS).

## Token custom-property names (confirmed, for authoring the stylesheet)

`--primitiv-body-{xs..xl}-{font-family,font-size,line-height,font-style,font-weight}`,
`--primitiv-heading-{h1..h6}-*`, `--primitiv-content-{primary,secondary,muted,disabled}`,
`--primitiv-highlight-background`, `--primitiv-surface-*`, `--primitiv-border-*`,
`--primitiv-font-family-{text,heading,mono}`, `--primitiv-space-space-N`,
`--primitiv-radii-N`. Density resolves automatically via `[data-density]`, theme
via `[data-theme]` (already in the token layer).

## Progress

- [x] **Reset layer activated (emit change) — VERIFIED.** `crates/primitiv-emit/src/css.rs`
  `SUBLAYER_DECLARATION` now leads with `primitiv.reset`; the 6 token goldens
  (`crates/primitiv-emit/tests/golden/{tokens,theme-modes,token-pipeline}.{css,scss}`)
  and the CLI assertions in `crates/primitiv-cli/src/commands/tokens_tests.rs`
  were updated to match. Confirmed green: `cargo test --workspace` (75 passing)
  and the coverage gate (`cargo llvm-cov --workspace --exclude harmoni-core
  --exclude harmoni-wasm --fail-under-lines/regions/functions 100`) both pass.
- [x] **Base element stylesheet authored** (step 3) at
  `crates/primitiv-emit/assets/base.{css,scss}` — bare-element styles for the
  inline marks + block prose in `@layer primitiv.reset`, fully tokenised (all 76
  `var(--primitiv-*)` references resolve against the emitted token layer; SCSS
  mirror is byte-identical, the base layer defining no `$primitiv-*` aliases).
  The `font-style` Figma token (Regular/SemiBold) is intentionally not bound —
  it carries the Figma style *name*, not a CSS `font-style`; CSS uses
  `font-weight` per the registry convention. `list/marker-gap` is unbound (no
  native-marker CSS property).
- [x] **Distributed via `tokens` / `init`** (step 4). The base sheet is embedded
  in `primitiv-emit` (`base::{BASE_CSS, BASE_SCSS}`, from `assets/base.{css,scss}`).
  `tokens` now writes a **sibling `primitiv-base.{css,scss}`** next to the token
  layer and **prepends `@import "./primitiv-base.<ext>";`** to it (the import leads
  the file, as CSS requires); CSS/Tailwind share the `.css` sheet, SCSS takes the
  `.scss` mirror. With no file target the base layer is **inlined after the tokens
  on stdout** so the stream stays self-contained. `init` inherits this for free
  (it delegates to `tokens`). Driven RED→GREEN with unit tests
  (`tokens_tests.rs`) + an on-disk e2e (`tests/cli.rs`); `cargo test --workspace`
  green and the coverage gate holds at 100% lines/regions/functions.

## Remaining (tasks)

1. ~~Verify the reset-layer cycle~~ — **done** (see Progress).
2. Regenerate `apps/workbench/src/primitiv-tokens.css` (highlight + mono parity).
3. ~~**Author the base element stylesheet**~~ — **done**
   (`crates/primitiv-emit/assets/base.{css,scss}`); the original spec follows. Inline marks
   (strong, em→synthetic oblique via `transform`, mark→`--primitiv-highlight-background`,
   del→strikethrough+muted, ins→underline, abbr→dotted underline+secondary,
   small→one-step-down+muted, sub/sup→native baseline + smaller, q→curly quotes
   via `quotes`/`::before/::after`+secondary) **plus** base block prose
   (p, h1–h6, ul/ol/li, dl/dt/dd, blockquote, hr, figure/figcaption, code, pre,
   kbd, a, table defaults), all tokenised (no magic numbers — see
   `registry-stylesheet-conventions`), in `@layer primitiv.reset`. CSS + SCSS
   mirror.
4. ~~**Distribute** it via `tokens`/`init`~~ — **done** (sibling
   `primitiv-base.{css,scss}` + `@import`; stdout inlines; see Progress).
5. **Table** registry entry — contract + styles.css/scss + generated recipe/wrapper
   (structural compound, like Tabs), add to `registry.json` + `EmbeddedRegistry`
   `include_str!`, contract `data-*` drift guard.
6. **Divider** registry entry — same, simpler (orientation modifier).
7. **Docs/RFC** — RFC 0008 §7 (reset now populated/declared),
   `docs/transfer-and-next-steps.md`, `packages/react/README.md` components table,
   cross-ref from `docs/figma-typography-checklist.html`.

## Gotchas

- Strict TDD, **100% lines + regions + functions** on the CLI crates
  (`cargo llvm-cov --workspace --exclude harmoni-core --exclude harmoni-wasm`).
- Golden files are **hand-authored, never captured** (no `insta`).
- D54 invariant: adding a *component* touches only `registry/` + the headless
  package, never CLI/emit *logic*. The reset-layer + base-stylesheet distribution
  are foundation work (allowed), not component work.
- `size-size` / `space-space` token-name doubling is current/expected.
