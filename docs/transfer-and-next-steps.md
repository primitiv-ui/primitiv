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
- [x] **Token emitter** (RFC 0006 §4) — DTCG → CSS (canonical) / SCSS / Tailwind, the pure `primitiv-emit` crate (TS/JS dropped, D50). TDD with golden files from the existing `packages/tokens` fixtures. Both `tokens` and the example styles depend on it, so it goes first. Its output shape is fixed by **RFC 0008**: the `@layer primitiv` sublayer stack, no `!important`, and the two-tier token split (shared theme tokens once; per-component API tokens inside each component stylesheet) — bake both into the first golden file.
  - **Done (CSS / SCSS / Tailwind) — CSS-canonical emit is done end-to-end** (`emit_tokens_css`): DTCG parse/flatten → category-aware number formatting → mode-aware flatten → `var()` alias linking → `:root` + `[data-theme]`/`[data-density]` scope blocks inside `@layer primitiv.tokens`, no `!important`. Proven against the real `packages/tokens` (all 1199 aliases linked, both axes scoped). The **SCSS serialiser** is also landed (`emit_scss` / `emit_tokens_scss`): the canonical CSS verbatim followed by `$primitiv-*` variables resolving to the custom properties (deduped across mode scopes), the thinnest adapter over the CSS (RFC 0006 §4.2). The **two-tier per-component split** is landed too (`emit_component_css` / `emit_component_tokens_css`): a `.primitiv-<name>` block of `--primitiv-<name>-<part>` API tokens emitted inside the component's own stylesheet in `@layer primitiv.base` (not the shared file), with alias values linked to `var()` references (RFC 0008 §3.2). The **`primitiv.theme` overrides layer** is landed (`emit_theme_css` / `emit_theme_overrides_css`): paired light + dark brand overrides emitted as a separate file in `@layer primitiv.theme` (above `primitiv.tokens`, no sublayer declaration), so a re-skin beats the base palette by layer order (RFC 0006 §5 / RFC 0008 §5). The **Tailwind v4 serialiser** is landed (`emit_tailwind` / `emit_tailwind_tokens`): a `@theme` preset mapping the shared surface (once per name, deduped across modes) onto Tailwind's namespaces (`space`→`spacing`, `font-size`→`text`, …) as `var()` references, so utilities resolve the custom properties and a mode ancestor re-skins them (RFC 0006 §4.2 / RFC 0009 §4.2). A **TS/JS serialiser** was originally landed but has since been **dropped (D50)** — it inlined values rather than emitting `var()` references, so it could not lean on the cascade to resolve theme/density, and the mode-varying tokens it blocked on are exactly the ones that must not be frozen into JS; `emit_ts` / `emit_ts_tokens` and the inlining resolvers (`resolve_aliases` / `resolve_against_base`) that served only it were removed. **The three cascade-based formats (CSS / SCSS / Tailwind) are the supported set.** The `@custom-variant dark` remap stays a CLI `add`-wiring concern (RFC 0009 §4.2). The remaining emitter-adjacent work is the `primitiv theme` brand→palette computation that feeds the override docs (separate item below).
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
    **Complete** across all supported formats: the TS theme-override serialiser
    that was the last open piece is no longer needed — TS was **dropped (D50)**,
    since the paired light + dark brand ramp is exactly the mode-varying case a
    value-inlining TS object cannot represent without fighting the cascade.
- [x] **Mode scoping** (RFC 0009) — emit `[data-theme]` + `[data-density]` scopes (density-neutral names, the `context.<density>` axis collapsed into `[data-density]`); ship the Tailwind `dark:`-variant remap. Falls out of the emitter (it is how dark + density are emitted), so it lands with the token emitter, not as separate work.
  - **Done (theme + density scopes)** — emitted by the token pipeline (`Axis`, `scope_selectors`, `Scope`, default-first mode ordering). The `:root` default sharing and `[data-*]` overrides match RFC 0009 §2.2. **Remaining:** the Tailwind `dark:`-variant remap (a CLI `add`-wiring concern, RFC 0009 §4.2), which lands with the CLI.
- [ ] **Styling contract + `contract.json`** per component (RFC 0004 §3) — hybrid generation (data-* auto-verified, modifiers/custom-props authored).
  - **Button landed.** `registry/r/button/contract.json` is the first hybrid
    contract: the `data-*` half (`data-disabled`, `source: "auto"`) is
    drift-guarded against the rendered headless `Button` by a `packages/react`
    test (`Button.contract.test.tsx`) so it cannot drift from what the component
    emits; the authored half (`.primitiv-button` root class, `--primary…--link` /
    `--xs…--xl` modifiers, the `--primitiv-button-*` custom-property API incl.
    typography) is hand-written. The React package is **untouched** (stays
    headless — root/part class *emission* is parked for the `add`-wiring
    increment, options sketched: generated local wrapper vs provider vs
    always-inert). **Remaining:** the same for `switch`.
- [ ] **Default theme authoring** in the workbench (RFC 0006 §7) — ported from Figma, one design emitted per format.
  - **Button CSS landed.** `registry/r/button/styles.css` is the canonical
    default theme in the RFC 0008 `primitiv.base`/`variants`/`states` layer
    shape, wiring `--primitiv-button-*` to the synced `action/*` (colour),
    `framed-control/*` (sizing) and `label/*` (typography) tokens, with
    `text-box` leading-trim. The workbench Button example imports the generated
    token layer + this canonical CSS and applies the contract classes, so the
    deployed workbench is the visual-check surface. The **SCSS form is now
    landed** (`registry/r/button/styles.scss`): per D ("Registry CSS, derive
    rest"), it is `styles.css` *verbatim* (SCSS is a strict superset of CSS)
    followed by one `$primitiv-button-*` alias per declared knob, produced by a
    new `emit_component_scss(css)` in `primitiv-emit` (mirrors the token-layer
    `emit_scss`) and held to the canonical CSS by a drift-guard test asserting
    the committed file equals `emit_component_scss(styles.css)`. The **Tailwind
    v4 recipe is now landed** (`registry/r/button/tailwind/button.recipe.ts`):
    authored, not transpiled (RFC 0006 §6.1 — arbitrary CSS → utilities is
    lossy), it is a `cva` function over the **contract's modifier classes** (not
    utilities), so the styling stays in `styles.css` and round-trips perfectly
    (keyframes, the knob seam, `text-box` trim — none of which have a Tailwind
    utility form). The Tailwind format therefore rides on the CSS contract:
    `formats.tailwind` ships `styles.css` + the recipe, and `cva` is a
    Tailwind-format-scoped package (`dependsOn.packagesByFormat.tailwind`) the
    existing `add` package-install effect ensures only when that format is
    chosen. A keys-match drift guard
    (`packages/react/src/Button/__tests__/Button.recipe.test.ts`) pins the
    recipe to `contract.json`. **Button's format trio (CSS / SCSS / Tailwind) is
    complete.** Values are authored-from-tokens and will be reconciled against
    the Figma Button design (no Figma access until 2026-06-16). `switch` to
    follow.
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
    their format and path defaults. The **`tokens` command is now landed
    (CSS)** (`commands/tokens.rs`): it embeds the design-system DTCG documents
    (`packages/tokens/src/*.json`) via `include_str!`, routes them into the
    emitter per the figma-token-sync collection table (`primitives` +
    `interaction` → base; `palette` + `intent` → theme axis; `context` →
    density axis), and writes the token layer to `--out` through the
    `FileSystem` port (RFC 0005 §2.3). It now takes a **`--format`
    (`css` | `scss` | `tailwind`, default `css`)** flag, dispatching the embedded
    sources to `emit_tokens_css` / `emit_tokens_scss` / `emit_tailwind_tokens`
    (the three supported formats; TS was dropped, D50). It is now the
    **first consumer of `config::resolve`**: with `--out` omitted it walks up
    from the working directory to the nearest `primitiv.json` and writes to its
    `tokens.path` (RFC 0005 §2.3 / §3.2), so an `init`-ed project needs no flag.
    The `FileSystem` port grew a `current_dir` method (thin `OsFs` passthrough;
    the fake reports a settable dir and can fail it) so the walk-up's start is
    driven in tests without touching the bin shell. With `--format` omitted it
    now also **defaults the format from the config's `tokens.format`** (then CSS),
    consulting `primitiv.json` via `config::try_resolve` — a new variant of
    `resolve` that returns `Ok(None)` for a missing config (fine for a format
    default) while a **malformed** config still errors. The **`init` command is
    now landed (non-interactive core)** (`commands/init.rs`): it gathers
    format / brand / styles-path / styles-enabled / component-alias from
    order-free flags (each defaulted — `css`, `#0a7755`, `src/styles/primitiv`,
    enabled, no alias), hand-renders the canonical `primitiv.json` (an authored
    golden, not `serde_json`, so the bytes are exact — RFC 0007 §4), and writes it
    to the working directory through the `FileSystem` port (`current_dir` + the
    dormant `exists`), the durable config every other command already reads
    (RFC 0005 §2.1 / §3.1). It is the **write-side counterpart to `config::resolve`**
    and the first consumer of `exists`. Honouring **Principle 2 (never clobber)**,
    an existing `primitiv.json` is a hard error unless `--force` is given — a new
    `CliError::Conflict` variant (exit code `6`). The token-layer file extension
    tracks the format (`tailwind` → `.css`, since the preset is CSS). The
    **non-project guard is now landed** (RFC 0005 §1.5.1): `init` configures an
    *existing* project, so a working directory with no `package.json` is a hard
    error (`CliError::Project`, exit code `8`) pointing at `npm create vite` /
    `create-next-app`, rather than seeding a `primitiv.json` next to nothing — it
    never scaffolds an app. **tsconfig/jsconfig alias detection is now landed**
    (RFC 0005 §3.3 / D32): a new pure `detect` module reads the working
    directory's `tsconfig.json` then `jsconfig.json` through the `FileSystem`
    port and maps a root `compilerOptions.paths` mapping
    (`"<prefix>/*"` → `./src/*` / `src/*` / `./*`) to the consumer's
    `<prefix>/components` import alias; an explicit `--alias-components` flag
    still wins, a present-but-aliasless config is authoritative (no fall-through),
    a malformed config falls back to relative imports (an empty `aliases` map),
    and a non-`NotFound` read is a hard `CliError::Io`. **Still deferred**
    (the testable seam was deliberately the flags core): framework /
    package-manager *persistence* at init (the lockfile package-manager detector
    in `package_manager.rs` already exists and is reusable; `primitiv.json`
    carries no `packageManager` field today, so `add` re-detects it), and
    interactive prompting — so `--yes` is not yet wired (init uses the process cwd
    via the port). The
    **config-less `tokens` → stdout path is now landed** (Principle 4): a new
    **`Output` port** (`ports/output.rs` — an `OsStdout` passthrough adapter + an
    `InMemoryOutput` capture fake, mirroring `FileSystem`) is threaded through
    `run` / `main`, and `tokens` now resolves its destination in three tiers —
    explicit `--out` wins, else the config's `tokens.path`, else **stdout** — so
    the literal `tokens --format css` with no `--out`/config streams the layer
    (RFC 0005 §2.3 / Principle 4) instead of erroring. The old "needs `--out` or a
    config" error is gone. **`--cwd` global flag — deferred (decided):** every
    command resolves the working directory through the port's `current_dir`
    (process cwd); a `--cwd` override is a cross-cutting concern best added with
    `add`, where monorepo package targeting first matters, not bolted on here. The
    **`list` command + the static registry are now landed** (RFC 0005 §2.5 / §6):
    a new **`Registry` port** (`ports/registry.rs` — an `EmbeddedRegistry` adapter
    that bakes the registry into the binary like the DTCG tokens, plus an
    `InMemoryRegistry` fake) is the last I/O seam; a typed `RegistryIndex`
    (`registry.rs`, serde, mirroring `config.rs`) parses the index; and
    `commands/list.rs` writes an aligned `COMPONENT  VERSION` table to stdout via
    the `Output` port, or streams the raw index with `--json` (the agent
    affordance, §6.5). The seed **`registry/registry.json`** lists `button` and
    `switch` (full `dependsOn` / `formats` / `contract` shape; only version +
    name are surfaced today). A new `CliError::Registry` variant (exit code `7`)
    covers an unreachable registry or a malformed index. The remote GitHub-raw
    HTTPS adapter and a `--registry <path>` override (§6.4) slot in behind the
    port later — deferred until remote fetch is actually needed (no HTTP dep
    pulled in yet). The **`add` command's resolution spine is now landed** (RFC
    0005 §2.2 / §4.1 step 1 / §4.4): `ComponentEntry` grew a defaulted
    `dependsOn.components` (`registry.rs`), and `commands/add.rs` loads the index
    through the `Registry` port, resolves each requested component **plus its
    transitive component deps** (an `insert`-guarded `BTreeSet` walk that both
    deduplicates and stays cycle-safe), and reports the sorted install plan to
    stdout via the `Output` port. A requested or depended-on component the
    registry doesn't carry is a new `CliError::NotFound` variant (exit code `9`)
    pointing at `primitiv list`. The hand-rolled parser accepts `add
    <component...>` (≥1 required). The **install plan now carries the npm packages
    to ensure** (RFC 0005 §4.4): `DependsOn` grew a defaulted `packages` list, and
    `add` reports the deduplicated, sorted union of the resolved components'
    `dependsOn.packages` (the headless library) under a `Packages to ensure:`
    section, omitted when none. **`add --json` is landed** (RFC 0005 §5 / §6.5):
    the same plan — components with versions, plus the packages — as
    machine-readable JSON for the Agent profile, hand-rendered to exact bytes.
    The **package-install effect is now landed** (RFC 0005 §4.1 step 2): a new
    `PackageManager` enum (`package_manager.rs`) detects pnpm/yarn/bun/npm from
    the project lockfile (npm the default) and builds the install command, and a
    new **`ProcessRunner` port** (`ports/process.rs` — an `OsProcessRunner` that
    spawns the manager and maps a non-zero exit to an error, plus an
    invocation-recording `InMemoryProcessRunner` fake) is the seam `add` runs it
    through. `add` now ensures the resolved components' `packages` via one
    detected-manager invocation in the working directory; a spawn failure or
    non-zero exit is a new `CliError::Install` variant (exit code `10`).
    **`--dry-run` is landed** (RFC 0005 §5): it reports the plan and stops before
    installing — and is what the `add` e2e uses, so the real binary never shells
    out to a live package manager (the install path is proven at the command layer
    with the runner fake; the `OsProcessRunner` adapter is unit-tested with
    harmless commands). **Remaining for `add`** (§4.2–§4.4): the style-copy +
    refresh/`primitiv.lock` semantics (needs the registry to serve per-component
    file bytes and the authored style files from items 5/6), project wiring
    (§4.3), the `--styles-only` / `--no-styles` / `--format` / `--path` /
    `--force` flags, the `--registry` / HTTPS registry adapter, and routing the
    package manager's own output to stderr so `--json` keeps a clean stdout (today
    a non-dry-run `--json` install interleaves the manager's chatter with the JSON;
    agents wanting pure JSON use `--dry-run`). **Other remaining CLI work:**
    interactive prompting for `init` (the alias detection above now feeds the
    pre-filled prompt; the lockfile package-manager detector is reusable for the
    manager prompt); the `list` **"installed in this project"** column; the
    Tailwind `dark:`-variant remap (RFC 0009 §4.2).
- [ ] **Distribution** (RFC 0005 §7) — Rust binary via `optionalDependencies` (`@primitiv-ui/cli-*`), `cargo-dist`/napi-rs matrix; supersede the published v0.0.1 name-reservation placeholders with the real `primitiv-ui` / `create-primitiv-ui` at a higher version.

## ❓ Open questions

**Cleared before the build (2026-06-10, D45–D49)** — the pre-build open questions
are now settled: root-class emission (component-emitted identity classes, D45),
Tailwind v4-only (D46), nested+typed TS tokens (D47 — **later reversed by D50,
which drops the TS/JS format entirely**), paired light+dark from
`primitiv theme` with a stable structural contract (D48), and the operational
cluster — `cargo-llvm-cov`, in-memory FS for command tests, separate
`primitiv.theme` file, reserved-empty reset layer, GitHub-raw registry, separate
`primitiv.lock` manifest, Deno out of scope (D49). Plus the earlier settles: BEM
part naming, hybrid `contract.json`, the (now three) cascade-based formats,
cascade layers + two-tier token scoping (RFC 0008), and
`data-theme`/`data-density` mode scoping (RFC 0009).

**Decided during the build (2026-06-10):**

- **Number-unit policy** — DTCG types every number as `"number"`, so the emitter
  maps the unit by token **category** (first path segment): length categories
  (`space`, `size`, `radii`, `font-size`, `line-height`, `border-width`,
  `letter-spacing`) → `rem` at a 16px base; `opacity` → a unitless `0–1` ratio;
  everything else (`font-weight`) → the unitless number. See `value.rs`.
- **Alias emit = `var()` references for every format** — a DTCG alias
  `{color.brand.500}` emits as `var(--primitiv-color-brand-500)` (`link_aliases`),
  preserving the override chain so a `primitiv theme` palette override
  propagates. This is the only alias path now: the inlining resolvers
  (`resolve_aliases` / `resolve_against_base`) existed solely for the TS object
  and were removed when TS was dropped (D50) — `primitiv theme` value
  computation turned out to use the `var()`-linking path too.

**Deliberately deferred (answer emerges during the build):**

- Config-parser fuzzing (RFC 0007 §11.3) — once the parsers exist.
- A `rust-cli-test-conventions` skill (RFC 0007 §11.4) — after the first command.
- Workbench styled-preview shape (RFC 0006 §10.5) — while authoring the theme.
- A first-class CSS Modules emit (RFC 0006 §10.6) — post-v1; no longer blocked.
- `DensityProvider` ergonomics + responsive-density emit shape (RFC 0009 §8.1–8.2)
  — post-v1.
