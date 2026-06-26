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

- [x] **Reset layer activated (emit change) — UNVERIFIED (no Rust toolchain on
  the authoring machine).** `crates/primitiv-emit/src/css.rs` `SUBLAYER_DECLARATION`
  now leads with `primitiv.reset`; the 6 token goldens
  (`crates/primitiv-emit/tests/golden/{tokens,theme-modes,token-pipeline}.{css,scss}`)
  and the CLI assertions in `crates/primitiv-cli/src/commands/tokens_tests.rs`
  were updated to match (RED→GREEN done as edits; **run `cargo test --workspace`
  to confirm**, then the coverage gate per `rust-cli-test-conventions`).

## Remaining (tasks)

1. Verify the reset-layer cycle (`cargo test --workspace` + `cargo llvm-cov …
   --fail-under-lines/regions/functions 100`).
2. Regenerate `apps/workbench/src/primitiv-tokens.css` (highlight + mono parity).
3. **Author the base element stylesheet** — inline marks
   (strong, em→synthetic oblique via `transform`, mark→`--primitiv-highlight-background`,
   del→strikethrough+muted, ins→underline, abbr→dotted underline+secondary,
   small→one-step-down+muted, sub/sup→native baseline + smaller, q→curly quotes
   via `quotes`/`::before/::after`+secondary) **plus** base block prose
   (p, h1–h6, ul/ol/li, dl/dt/dd, blockquote, hr, figure/figcaption, code, pre,
   kbd, a, table defaults), all tokenised (no magic numbers — see
   `registry-stylesheet-conventions`), in `@layer primitiv.reset`. CSS + SCSS
   mirror.
4. **Distribute** it via `tokens`/`init` (TDD, golden, 100% coverage).
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
