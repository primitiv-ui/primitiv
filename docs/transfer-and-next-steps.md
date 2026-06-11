# Checklist — org transfer & next steps

Snapshot after the 2026-06-09 consumption-layer design session. The npm name
reservation is **done**; the rest is for the 16th onward. Transfer detail lives
in [`../RELEASING.md`](../RELEASING.md); the full decision log (D1–D25) lives in
[`consumption-design.md`](consumption-design.md).

## ✅ Done (2026-06-09)

- Consumption layer designed: `consumption-design.md` + RFCs **0004–0006**
  (`rfcs/`), indexed in `rfcs/README.md`.
- npm names **reserved** (placeholder packages, v0.0.1, owner: `simonrevill`):
  - `primitiv-ui` — the CLI package (command: `primitiv`)
  - `create-primitiv-ui` — the `npm create primitiv-ui` scaffold
- npm **scope `@primitiv-ui` secured** — the `primitiv-ui` npm **org** is owned
  (org names carry no `@`; owning the org reserves every `@primitiv-ui/*` name).
  So `@primitiv-ui/react`, `/icons`, `/tokens`, `/cli-*` need **no** per-package
  registration — each is created on first publish.
- Placeholder package source lived under `reserved/` (outside the pnpm
  workspace) — removed from disk after publishing; git history preserves it.

## 🔐 Security cleanup — done (2026-06-09)

- [x] Deleted the `NPM_TOKEN` repo secret.
- [x] Revoked the granular npm token.
- [x] Removed `.github/workflows/reserve-names.yml` — its one job is done.

## 📦 Org transfer to `primitiv-ui` (the 16th) — detail in RELEASING.md §1

- [ ] Transfer `simonrevill/primitiv` → `primitiv-ui/primitiv` (Settings → Transfer ownership).
- [ ] Update local remotes: `git remote set-url origin https://github.com/primitiv-ui/primitiv.git`.
- [ ] Re-apply branch protection / rulesets (they don't always travel).
- [ ] Re-check GitHub Pages base (`deploy-docs.yml` `WORKBENCH_BASE` — still correct if the repo name stays `primitiv`).
- [ ] Re-add Actions secrets (they do **not** transfer). For real releases prefer **Trusted Publishing** (tokenless) over re-adding `NPM_TOKEN`.
- [ ] Configure the npm **Trusted Publisher** per package → `primitiv-ui/primitiv` + `publish.yml`.
- [ ] Link each **JSR** package to the new repo.
- [ ] When the real packages ship, set their `repository` URLs to `primitiv-ui/primitiv` (the placeholders deliberately omit them).
- [ ] Optional: add the `@primitiv-ui` npm org as an owner of the unscoped `primitiv-ui` / `create-primitiv-ui` names (currently owned by the personal account).

## 🏗️ Build phase — the work that comes next (per the RFCs)

Foundation-first order (test strategy for all of it: **RFC 0007** — ports &
adapters, hand-authored golden files, 100% coverage):

- [x] **Rust CI + test harness** (RFC 0007 §7) — add `cargo test --workspace` + `cargo llvm-cov` gate (Rust runs in no workflow today); scaffold the `primitiv-emit` / `primitiv-cli` crates (lib + thin bin) and the port traits.
  - **Done (2026-06-10).** `crates/primitiv-cli` holds the `FileSystem` port + in-memory fake; `crates/primitiv-emit` is the pure emitter; `.github/workflows/rust.yml` runs `cargo test --workspace` and a `cargo llvm-cov --fail-under-lines 100` gate scoped to the CLI crates (`--exclude harmoni-core --exclude harmoni-wasm`, so new CLI crates fall under it automatically). 100% regions/lines/functions held throughout.
- [x] **Token emitter** (RFC 0006 §4) — DTCG → CSS (canonical) / SCSS / TS / Tailwind, the pure `primitiv-emit` crate. TDD with golden files from the existing `packages/tokens` fixtures. Both `tokens` and the example styles depend on it, so it goes first. Its output shape is fixed by **RFC 0008**: the `@layer primitiv` sublayer stack, no `!important`, and the two-tier token split (shared theme tokens once; per-component API tokens inside each component stylesheet) — bake both into the first golden file.
  - **Done (all four formats) — CSS-canonical emit is done end-to-end** (`emit_tokens_css`): DTCG parse/flatten → category-aware number formatting → mode-aware flatten → `var()` alias linking → `:root` + `[data-theme]`/`[data-density]` scope blocks inside `@layer primitiv.tokens`, no `!important`. Proven against the real `packages/tokens` (all 1199 aliases linked, both axes scoped). The **SCSS serialiser** is also landed (`emit_scss` / `emit_tokens_scss`): the canonical CSS verbatim followed by `$primitiv-*` variables resolving to the custom properties (deduped across mode scopes), the thinnest adapter over the CSS (RFC 0006 §4.2). The **two-tier per-component split** is landed too (`emit_component_css` / `emit_component_tokens_css`): a `.primitiv-<name>` block of `--primitiv-<name>-<part>` API tokens emitted inside the component's own stylesheet in `@layer primitiv.base` (not the shared file), with alias values linked to `var()` references (RFC 0008 §3.2). The **`primitiv.theme` overrides layer** is landed (`emit_theme_css` / `emit_theme_overrides_css`): paired light + dark brand overrides emitted as a separate file in `@layer primitiv.theme` (above `primitiv.tokens`, no sublayer declaration), so a re-skin beats the base palette by layer order (RFC 0006 §5 / RFC 0008 §5). The **TS/JS serialiser** is landed (`emit_ts` / `emit_ts_tokens`): a nested, typed token object (`tokens.color.primary`) exported `as const`, keys quoted when not valid identifiers, alias values **inlined** via `resolve_aliases` (not `var()` references — the TS object is for tokens-in-code), RFC 0006 §4.2 / D47. Mode-aware TS (theme/density in one tree) is deferred to the CLI `tokens` command. The **Tailwind v4 serialiser** is landed (`emit_tailwind` / `emit_tailwind_tokens`): a `@theme` preset mapping the shared surface (once per name, deduped across modes) onto Tailwind's namespaces (`space`→`spacing`, `font-size`→`text`, …) as `var()` references, so utilities resolve the custom properties and a mode ancestor re-skins them (RFC 0006 §4.2 / RFC 0009 §4.2). **All four formats are now done.** The `@custom-variant dark` remap stays a CLI `add`-wiring concern (RFC 0009 §4.2). The remaining emitter-adjacent work is the `primitiv theme` brand→palette computation that feeds the override docs (separate item below).
- [x] **`primitiv theme`** (RFC 0006 §5) — link `harmoni-core`; brand → palette → token overrides; emit light + dark token sets.
  - **Done (CSS-canonical, brand → paired overrides).** `harmoni-core` is linked
    natively into `primitiv-emit`: a new `api::generate_brand_pair` encapsulates
    the system default theme curves (`TARGET_LIGHTNESS` / `TARGET_LIGHTNESS_DARK`),
    so the adapter passes only the brand. `emit_theme_brand_css(brand)` derives a
    contrast-checked paired light + dark palette, maps each side's ramp to
    `--primitiv-color-brand-50…900` tokens (`theme::brand_tokens`), and serialises
    them into the `primitiv.theme` layer — light sharing `:root,
    [data-theme="light"]`, dark in `[data-theme="dark"]` — reusing the existing
    `emit_theme_css` surface. Step 500 is the brand byte-for-byte on both sides;
    the dark ramp is the anchored model (reliably-dark bg → light text). The
    **emitted structure is the stable contract (D48)**; the hex values track
    `harmoni-core` and evolve non-breakingly (a `Display for SwatchLabel` renders
    the path segment). The **SCSS and Tailwind theme-override serialisers are
    landed** (`emit_theme_brand_scss`: the `primitiv.theme` CSS plus the resolving
    `$primitiv-*` vars; `emit_theme_brand_tailwind`: the same custom-property block
    plus the `@theme` preset — self-contained in one file, unlike the token-layer
    Tailwind which assumes the always-emitted canonical CSS), and the `theme`
    command takes a **`--format` flag** (`css` | `scss` | `tailwind`, default
    `css`) parsed into a `Format` enum and dispatched through to the emitter.
    **Remaining:** the TS theme-override serialiser and its `--format ts` variant;
    TS additionally needs the deferred mode-aware shape decided first (the
    paired light + dark brand ramp is exactly the mode-aware case TS punts on).
- [x] **Mode scoping** (RFC 0009) — emit `[data-theme]` + `[data-density]` scopes (density-neutral names, the `context.<density>` axis collapsed into `[data-density]`); ship the Tailwind `dark:`-variant remap. Falls out of the emitter (it is how dark + density are emitted), so it lands with the token emitter, not as separate work.
  - **Done (theme + density scopes)** — emitted by the token pipeline (`Axis`, `scope_selectors`, `Scope`, default-first mode ordering). The `:root` default sharing and `[data-*]` overrides match RFC 0009 §2.2. **Remaining:** the Tailwind `dark:`-variant remap (a CLI `add`-wiring concern, RFC 0009 §4.2), which lands with the CLI.
- [ ] **Styling contract + `contract.json`** per component (RFC 0004 §3) — hybrid generation (data-* auto-verified, modifiers/custom-props authored).
- [ ] **Default theme authoring** in the workbench (RFC 0006 §7) — ported from Figma, one design emitted per format.
- [ ] **The CLI** (RFC 0005) — `init` / `add` / `tokens` / `theme` / `list`, `primitiv.json`, the static registry, refresh + wiring behaviour.
  - **Started.** The hand-rolled arg parser, the `theme` command (CSS / SCSS /
    Tailwind via `--format`), the `FileSystem` port (+ `InMemoryFs` fake) and the
    e2e-covered bin shell are landed. **`primitiv.json` config is now landed**
    (`config.rs`): a serde-typed `Config` with a pure `parse`, and a `resolve`
    that walks up from a start directory through the `FileSystem` port to the
    nearest `primitiv.json` (RFC 0005 §3.1–3.2) — `NotFound` ascends, any other
    read error is a hard I/O failure, an exhausted search errors with the search
    root. A new `CliError::Config` variant (exit code `5`) covers missing /
    malformed config. This unblocks `tokens` / `init` / `add`, which read it for
    their format and path defaults. **Remaining:** the `tokens`, `init`, `add`,
    `list` commands; the static registry (+ the `Registry` port); refresh +
    wiring behaviour; the Tailwind `dark:`-variant remap (RFC 0009 §4.2).
- [ ] **Distribution** (RFC 0005 §7) — Rust binary via `optionalDependencies` (`@primitiv-ui/cli-*`), `cargo-dist`/napi-rs matrix; supersede the published v0.0.1 name-reservation placeholders with the real `primitiv-ui` / `create-primitiv-ui` at a higher version.

## ❓ Open questions

**Cleared before the build (2026-06-10, D45–D49)** — the pre-build open questions
are now settled: root-class emission (component-emitted identity classes, D45),
Tailwind v4-only (D46), nested+typed TS tokens (D47), paired light+dark from
`primitiv theme` with a stable structural contract (D48), and the operational
cluster — `cargo-llvm-cov`, in-memory FS for command tests, separate
`primitiv.theme` file, reserved-empty reset layer, GitHub-raw registry, separate
`primitiv.lock` manifest, Deno out of scope (D49). Plus the earlier settles: BEM
part naming, hybrid `contract.json`, all-four formats, cascade layers + two-tier
token scoping (RFC 0008), and `data-theme`/`data-density` mode scoping (RFC 0009).

**Decided during the build (2026-06-10):**

- **Number-unit policy** — DTCG types every number as `"number"`, so the emitter
  maps the unit by token **category** (first path segment): length categories
  (`space`, `size`, `radii`, `font-size`, `line-height`, `border-width`,
  `letter-spacing`) → `rem` at a 16px base; `opacity` → a unitless `0–1` ratio;
  everything else (`font-weight`) → the unitless number. See `value.rs`.
- **Alias emit = `var()` references for CSS** — a DTCG alias `{color.brand.500}`
  emits as `var(--primitiv-color-brand-500)` (`link_aliases`), preserving the
  override chain so a `primitiv theme` palette override propagates. The inlining
  resolvers (`resolve_aliases` / `resolve_against_base`) are reserved for the
  TS token object and `primitiv theme` value computation, **not** the CSS path.

**Deliberately deferred (answer emerges during the build):**

- Config-parser fuzzing (RFC 0007 §11.3) — once the parsers exist.
- A `rust-cli-test-conventions` skill (RFC 0007 §11.4) — after the first command.
- Workbench styled-preview shape (RFC 0006 §10.5) — while authoring the theme.
- A first-class CSS Modules emit (RFC 0006 §10.6) — post-v1; no longer blocked.
- `DensityProvider` ergonomics + responsive-density emit shape (RFC 0009 §8.1–8.2)
  — post-v1.
