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

## 📦 Org transfer to `primitiv-ui` — done (2026-06-16) — detail in RELEASING.md §1

- [x] Transfer `simonrevill/primitiv` → `primitiv-ui/primitiv` (Settings → Transfer ownership).
- [ ] Update local remotes: `git remote set-url origin https://github.com/primitiv-ui/primitiv.git` (per-developer; do on each clone).
- [ ] Re-apply branch protection / rulesets (they don't always travel) — verify on `main`.
- [ ] Re-check GitHub Pages base (`deploy-docs.yml` `WORKBENCH_BASE` — still correct if the repo name stays `primitiv`).
- [x] Actions secrets — went **fully tokenless (OIDC)**; `NPM_TOKEN` deleted, no secrets to re-add.
- [x] Configure the npm **Trusted Publisher** per package → `primitiv-ui/primitiv` + `publish.yml`.
- [x] Link each **JSR** package to the new repo.
- [x] Real packages shipped with `repository` URLs pointing at `primitiv-ui/primitiv`.
- [x] Update the `REGISTRY_REPO` const in `crates/primitiv-cli/src/commands/add.rs` (`simonrevill/primitiv` → `primitiv-ui/primitiv`) so `--registry <version>` resolves GitHub-raw at the transferred repo. It is the **only** hard-coded repo path in the CLI (the registry HTTPS base URL is derived from it). A `cli.rs` parse test pins the override forms but not the host, so this is a silent change to watch for.
- [ ] Optional: add the `@primitiv-ui` npm org as an owner of the unscoped `primitiv-ui` / `create-primitiv-ui` names (currently owned by the personal account).

## 🚀 First publish + JSR slow-types cleanup — done (2026-06-16)

- [x] **First publish at v0.1.0** — all 10 npm packages (5 `cli-*` platform
  packages, `primitiv-ui` wrapper, `create-primitiv-ui`, and the three
  libraries) plus the three JSR packages live, via tokenless OIDC.
- [x] **JSR slow-types cleanup** — the v0.1.0 packages shipped with
  `--allow-slow-types` as a bootstrap shortcut (scores: icons 29 / react 47 /
  tokens 70). Removed the flag; every exported symbol now has explicit types so
  JSR can analyse the public API without inference. All three pass
  `jsr publish --dry-run` clean. See RELEASING.md §6.
- [x] **Versions bumped to 0.1.1** across every publishable package (lockstep)
  + the three `jsr.json` files, ready for the release that carries the cleanup.
- [ ] **Publish 0.1.1** (Release or `workflow_dispatch`) — JSR re-scores each
  package once the new version lands.
- [ ] Improve **JSDoc coverage** on `icons` / `tokens` exports — the remaining
  JSR score factor after slow types (react is already well-documented).

## 🏗️ Build phase — the work that comes next (per the RFCs)

Foundation-first order (test strategy for all of it: **RFC 0007** — ports &
adapters, hand-authored golden files, 100% coverage):

> **Guiding invariant (D54).** Changing a component — new props, renamed
> variants, a restyle, a new format — must touch **only** the registry
> (`contract.json` / `styles.css`) and the headless package, never
> `primitiv-cli` / `primitiv-emit` *logic*. The CLI knows formats + the contract
> *schema* + file ops; the emitter knows generic transforms only. **Enforced** by
> testing CLI/emit on **synthetic fixture contracts** — real components only in
> e2e. **Button** (modifier-driven) + **Switch** (state-driven, a part, no
> `variant`) are the deliberately-different proof across CSS/SCSS/Tailwind.

> **Consumer styled-surface — sequenced plan (D51–D53).** The contract is the
> single authored API source; the recipe + JSDoc'd wrapper are generated from
> it. Order: **(1)** enrich the contract schema (`description` / `default` /
> `prop` / `options`) + update Button's drift guards; **(2)** `contract → recipe`
> and `contract → wrapper` emitters in `primitiv-emit`, golden-tested on
> synthetic contracts first, then Button (the #139 recipe is the recipe golden);
> **(3)** Switch contract + `styles.css` through the *same* generators (the
> generality proof); **(4)** `add` style-copy + wiring, schema-driven. `variant`
> is the consumer prop; `intent` stays the design-system / contract key.

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
  - **Done (theme + density scopes)** — emitted by the token pipeline (`Axis`, `scope_selectors`, `Scope`, default-first mode ordering). The `:root` default sharing and `[data-*]` overrides match RFC 0009 §2.2. The **Tailwind `dark:`-variant remap + layer-order statement** (RFC 0009 §4.2) landed with the CLI — `wiring.rs` (`SNIPPET`, `contains_wiring`, `patch`) and the `offer_wiring` / `patch_wiring` logic in `add.rs`; the idempotency check and the interactive detect-and-patch path are both tested end-to-end.
- [x] **Styling contract + `contract.json`** per component (RFC 0004 §3) — hybrid generation (data-* auto-verified, modifiers/custom-props authored). **Done for the v1 set (Button + Switch);** further components are routine application of the now-complete mechanism.
  - **Button landed.** `registry/components/button/contract.json` is the first hybrid
    contract: the `data-*` half (`data-disabled`, `source: "auto"`) is
    drift-guarded against the rendered headless `Button` by a `packages/react`
    test (`Button.contract.test.tsx`) so it cannot drift from what the component
    emits; the authored half (`.primitiv-button` root class, `--primary…--link` /
    `--xs…--xl` modifiers, the `--primitiv-button-*` custom-property API incl.
    typography) is hand-written. The React package is **untouched** (stays
    headless — root/part class *emission* is parked for the `add`-wiring
    increment, options sketched: generated local wrapper vs provider vs
    always-inert).
  - **Switch landed (the state-driven proof, D54).**
    `registry/components/switch/contract.json` is the deliberately-different second
    contract: the `data-*` half (`data-state="checked"|"unchecked"` — always
    present — plus `data-disabled`, `source: "auto"`) is drift-guarded against the
    rendered headless `Switch` (`Switch.contract.test.tsx`); the authored half is
    the `.primitiv-switch` root, a new **`parts`** field (the
    `primitiv-switch__thumb` decorative slot) and the `--primitiv-switch-*`
    custom-property API, with **no `modifiers`** (no `variant`). The react package
    gained a `SwitchProps` type alias — the `<Component>Props` convention the
    generated wrapper imports.
- [x] **Default theme authoring** in the workbench (RFC 0006 §7) — ported from Figma, one design emitted per format. **Done for the v1 set (Button + Switch)** across CSS / SCSS / Tailwind + the generated recipe/wrapper; values reconcile against Figma when access returns.
  - **Button CSS landed.** `registry/components/button/styles.css` is the canonical
    default theme in the RFC 0008 `primitiv.base`/`variants`/`states` layer
    shape, wiring `--primitiv-button-*` to the synced `action/*` (colour),
    `framed-control/*` (sizing) and `label/*` (typography) tokens, with
    `text-box` leading-trim. The workbench Button example imports the generated
    token layer + this canonical CSS and applies the contract classes, so the
    deployed workbench is the visual-check surface. The **SCSS form is now
    landed** (`registry/components/button/styles.scss`): per D ("Registry CSS, derive
    rest"), it is `styles.css` *verbatim* (SCSS is a strict superset of CSS)
    followed by one `$primitiv-button-*` alias per declared knob, produced by a
    new `emit_component_scss(css)` in `primitiv-emit` (mirrors the token-layer
    `emit_scss`) and held to the canonical CSS by a drift-guard test asserting
    the committed file equals `emit_component_scss(styles.css)`. The **styled
    surface is now generated from the contract (D51–D55).** `contract.json` is
    enriched to the single API source (array modifiers + `description` /
    `default` / `prop` / `options`), and `primitiv-emit` generates **both** the
    `cva` recipe (`registry/components/button/button.recipe.ts`) and the JSDoc'd wrapper
    (`registry/components/button/button.tsx`) from it — `contract → recipe` / `contract →
    wrapper` emitters proven against **synthetic** contracts (D54), with Button
    drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs`. The
    consumer prop is `variant` (`intent` stays the contract key, D52); the
    recipe + wrapper are the **format-independent** React surface gated by the
    **styles opt-in** (D55) — `cva` moved from a Tailwind-format dep to
    `styles.packages`; `formats` now selects only the stylesheet. The old
    `tailwind/button.recipe.ts` + the TS keys-match guard are superseded. The
    **Tailwind v4 recipe landed earlier (#139)** and now flows from the
    generator. **Button's format trio (CSS / SCSS / Tailwind) + the styled
    surface are complete.** Values are authored-from-tokens and will be
    reconciled against the Figma Button design (no Figma access until
    2026-06-16).
  - **Switch landed — the generality proof holds.** The state-driven,
    parts-based, no-`variant` Switch flows through the **same** generators as
    Button (proven on a synthetic parts/no-modifier fixture first, D54):
    `emit_recipe` emits a **base-only** `cva("primitiv-switch")` (and a
    reserved-word-safe `switchRecipe` const, since `export const switch` is a
    syntax error); `emit_wrapper` emits a **type-alias** props surface (no modifier
    props, also sidestepping the union controlled/uncontrolled type) and a
    **compound auto-render** that fills the thumb slot, so the consumer writes one
    `<Switch>` (shadcn parity, D51 — option A); `emit_component_scss` derives
    `styles.scss` unchanged. `registry/components/switch/{styles.css,styles.scss,
    switch.recipe.ts,switch.tsx}` are committed with drift guards; the workbench
    `SwitchExample` gained a contract-styled section + density row, and the shared
    token layer moved up to `apps/workbench/src/primitiv-tokens.css` (imported once
    in `main.tsx`).
  - **Modal landed — the first *bespoke* registry wrapper (2026-06-29).** Modal
    is the D53 escape-hatch proof: its `modal.tsx` is **hand-authored, not
    generated**, because `Modal.Root` (a no-DOM provider) and `Modal.Portal` take
    no `className`, which the className-on-every-part generator can't express.
    `registry/components/modal/{contract.json,styles.css,styles.scss,
    modal.recipe.ts,modal.tsx,README.md}` are committed, the manifest
    (`registry.json`) + embedded-file list (`ports/registry.rs`) + the `add --all`
    e2e count (11→12) updated. Styles the dialog surface (`elevation/modal` +
    `modal/*` sizing) and the backdrop in two places — the native `::backdrop` and
    the optional `.primitiv-modal__overlay` — both on the new `scrim` token. There
    is **no `primitiv-emit` drift guard** for a bespoke wrapper; `qa:registry-types`
    is the gate. **Token fix done alongside:** the `modal/*` Context variables were
    raw floats (emitting unitless numbers, unusable as CSS lengths); they were
    rebound to **alias the `space/*` / `radii/*` primitives per density mode** (like
    `framed-control/*`), so they emit `var(--primitiv-{space,radii}-*)` (rem,
    density-scaled, unit-bearing) and the stylesheet uses them directly — no `px`,
    no `calc`. Done in Figma + `context.json` + the emitted layer; resolved values
    are unchanged except the lone off-scale spacious `lg` gap (18 → 16, rounded to
    the nearest `space` step). **Future fast-follow (deferred):** generalise a `passthrough` part
    capability in `primitiv-emit` (a class-less forwarder for provider/portal
    parts) so a Modal-shaped compound could be generated rather than hand-authored
    — every future compound with a provider/portal would benefit (D53's
    "extend the schema once" path).
- [x] **The CLI** (RFC 0005) — `init` / `add` / `tokens` / `theme` / `list`, `primitiv.json`, the static registry, refresh + wiring behaviour. **Done — the command surface is v1 feature-complete** (interactive `init` + `--yes`; `add` resolve→install→styled+React surface+`contract.json`→lock refresh/`--force`/overwrite-keep→project wiring; `tokens`; `theme`; `list` with the installed column; embedded / local-dir / HTTPS registry adapters behind one port).
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
    and a non-`NotFound` read is a hard `CliError::Io`. **Interactive prompting is
    now landed** (RFC 0005 §2.1): each promptable `InitOptions` field is an
    `Option` (`None` = omitted), and `init` resolves each by flag → prompt →
    default. In an interactive TTY (and without `--yes`) it asks for example
    styles (a `[Y/n]` confirm), stylesheet format, brand colour, styles path, and
    the components import alias (each pre-filled with its default / the detected
    alias) via a new free-text `Prompt::ask(question, default)` primitive
    (`resolve_answer`: trimmed answer or the default on an empty line); the new
    global **`--yes`** flag accepts every default without prompting, and a
    non-interactive session takes them silently (Principle 3 — every prompt has a
    flag). The `InMemoryPrompt` fake grew a `fail_after(n)` counter so a specific
    prompt deep in the flow drives its `CliError::Io` branch. **Still deferred**
    (the testable seam was deliberately the flags core): framework /
    package-manager *persistence* at init (the lockfile package-manager detector
    in `package_manager.rs` already exists and is reusable; `primitiv.json`
    carries no `packageManager` field today, so `add` re-detects it). The
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
    covers an unreachable registry or a malformed index. The **`--registry <ref>`
    override is now landed in full** (§6.4): `classify_registry` routes an
    `http(s)://` URL or a version tag (`0.1.0` / `v1.2.3` → GitHub raw at that
    tag) to a new `HttpsRegistry` adapter (a blocking `ureq` fetch over rustls,
    no gzip), any other value to a `LocalRegistry` reading
    `<base>/registry.json` + `<base>/components/<component>/<file>` through the
    `FileSystem` port, and absence to the embedded copy — `add` picks the source
    at run time as a `&dyn Registry` trait object. The `HttpsRegistry` base URL is
    injected, so a loopback `TcpListener` server drives the real fetch path at
    100% with no network, no exemption, and no test dep (the `LocalRegistry` path
    also has an `OsFs` e2e). The **`add` command's resolution spine is now landed** (RFC
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
    harmless commands). The **style-copy spine is now landed** (RFC 0005 §4.1
    step 4): the `Registry` port grew a `file(component, file)` method (the
    `EmbeddedRegistry` bakes each component's per-format stylesheets in via a
    `(component, file, bytes)` table; the `InMemoryRegistry` fake gained
    `with_file`), the `FileSystem` port grew `create_dir_all` (a thin `OsFs`
    passthrough; the fake records a `fail_create_dir_to` knob), the registry
    index now models the `styles.formats` block (a `Formats::files(format)`
    accessor), and `add` copies each resolved component's configured-format
    stylesheet into `<styles.path>/<component>/`, the component directory created
    first. It is **gated on a styles-enabled `primitiv.json`** (D55): a
    headless-only install (no config) or `styles.enabled = false` copies nothing;
    a file the registry can't serve is a `CliError::Registry`. **`add`'s
    arguments are now an `AddOptions` struct** (mirroring `InitOptions`, so the
    remaining flags join without churning call sites), and the
    **`--styles-only` / `--no-styles` flags are landed**: `--styles-only` copies
    the styled surface but skips the package install (§4.1 step 2), `--no-styles`
    installs the package but skips the styles (step 3), and combining the two is a
    usage error (it would do neither). `--styles-only` also unlocked the **first
    real-binary `add` e2e for the copy** — it skips the install, so the bin never
    shells out to a live package manager. The **React-surface copy is now
    landed** (D55): `detect` grew a `components_path` (the inverse of
    `components_alias`, both now deriving from one `root_mapping` so the parse /
    `paths` branches live once) that maps a tsconfig/jsconfig root path mapping to
    `src/components` (or `components` for a Next.js no-`src` root), and `add`
    copies each component's format-independent recipe + wrapper into that
    directory — co-located flat (the wrapper imports its recipe as
    `./<name>.recipe`) — alongside the stylesheet copy, the fetch+write factored
    into a shared `copy_file`. With **no detectable alias** the surface falls back
    to a project-root `components` dir; an **unreadable** tsconfig is a hard
    `CliError::Io`. The registry index models the `styles.react` list and the
    `EmbeddedRegistry` bakes the recipe/wrapper in; the `--styles-only` e2e now
    asserts the full styled surface (stylesheet **and** React files) on a real
    filesystem. The **`add --format` and `--path` override flags are landed**
    (parsed into `AddOptions`, with the hand-rolled parser now value-aware):
    `--format` selects the stylesheet format and `--path` its destination for the
    copy, both overriding the config with no persistence (mirroring
    `tokens` / `theme`); the alias-placed, format-independent React surface is
    unaffected. The **`primitiv.lock` refresh semantics + `--force` are landed**
    (RFC 0005 §4.2): a new `lock` module hashes file content with a
    **dependency-free FNV-1a** (`fnv1a_hex`, stable across platforms unlike
    `std`'s `DefaultHasher`) and holds the `Lock` manifest (serde-read,
    hand-rendered bytes; a malformed lock degrades to empty so edits are never
    clobbered). Every copied file now routes through `Lock::should_write`: a new
    or untouched file (on-disk content still matches the recorded hash) is written
    and re-recorded; a **consumer-edited** file (content differs) is **kept**;
    `--force` overwrites regardless. `add` reads `primitiv.lock` beside the config,
    threads it through the stylesheet + React-surface copy, and writes the updated
    manifest back. The **package manager's stdout is now routed to stderr**
    (`OsProcessRunner` sets the child's stdout to the parent's stderr), so a
    non-dry-run `add --json` keeps a clean JSON stdout while install progress
    still reaches the user on stderr (RFC 0005 §5) — the earlier interleaving
    wart is gone. The **`--dry-run` refresh report** (per-file new/refresh/keep/overwrite
    status, both human and `--json`) is now landed — `planned_files` enumerates
    the same stylesheet + React-surface destinations the real copy would write,
    `Lock::classify` gives the status for each, and `--force` flips edited →
    overwrite in the label. The **interactive overwrite/keep prompt is now
    landed** (RFC 0005 §4.2): a new **`Prompt` port** (`ports/prompt.rs` — an
    `OsPrompt` that writes the question to stderr and reads stdin, end-of-input
    keeping edits, plus an `InMemoryPrompt` fake) is consulted for a
    consumer-edited file when the session is **interactive** (the bin decides once
    via `std::io::IsTerminal`, threaded through as a `bool`); the consumer chooses
    overwrite or keep (two-way — "skip" is redundant with keep for a single file,
    D-this-session). Non-interactively (CI / agents / a pipe) the edit is kept
    without prompting, and `--force` still overwrites all without asking; a
    `--yes` flag is intentionally deferred (non-breaking to add later). `add`'s
    copy decision moved from `Lock::should_write` (removed) to `Lock::classify` +
    the prompt. **Project wiring (§4.3) is now landed**: `wiring.rs` holds the
    `SNIPPET` (`@custom-variant dark` remap + `@layer` order statement),
    `contains_wiring` (idempotency check), and `patch` (prepend with blank-line
    separator); `--no-wiring` is parsed; `offer_wiring` / `patch_wiring` in
    `add.rs` dispatch between the interactive detect-and-patch Tier-1 path
    (detect entry CSS, ask `[Y/n]`, apply) and the non-interactive /
    `--no-wiring` Tier-2 floor (print snippet to stdout). All error paths
    covered; a new e2e test proves the real binary prints the snippet for a
    Tailwind-format project. **Contract copy (§4.4) is now landed**:
    `ComponentEntry` grew a defaulted `contract: Option<String>`, the
    `EmbeddedRegistry` bakes each component's `contract.json` in, and
    `planned_files` / `copy_styled_surface` copy it into the components directory
    alongside the recipe + wrapper when declared. **The `list` "installed in this
    project" column is now landed** (RFC 0005 §2.5): `primitiv.lock` grew a
    `components` set (`record_component`, serialised as a `components` array
    leading the `files` map), `add` records each resolved component as installed
    once its surface is copied, and `list` reads the lock beside the working
    directory to mark each component `yes` / `-` in a new `INSTALLED` column
    (`--json` stays the raw index); a new e2e proves the real `OsFs` +
    `Lock::read` path. **Interactive `init` prompting is now landed** (§2.1): a
    free-text `Prompt::ask` primitive + the `--yes` flag drive prompts for styles
    / format / brand / path / alias, each pre-filled with its default. **The
    `--registry <ref>` override is now landed in full** (§6.4): `LocalRegistry`
    (repo-local path) and `HttpsRegistry` (an `http(s)://` URL or a version tag →
    GitHub raw, a blocking `ureq`/rustls fetch) behind the same port, selected by
    `add` at run time; the HTTPS fetch path is covered at 100% by a loopback test
    server (no network, no exemption, no test dep). **The CLI command surface
    (`init` / `add` / `tokens` / `theme` / `list`) is now feature-complete for
    v1** — the only remaining RFC 0005 work is Distribution (Step 8).
- [x] **Distribution** (RFC 0005 §7) — **Done (2026-06-15).** Rust binary distributed via `optionalDependencies` per-platform packages; manual implementation (not cargo-dist / napi-rs — see decision below). REGISTRY_REPO updated; `publish.yml` extended; `RELEASING.md` updated with CLI section. The v0.0.1 placeholder packages (`primitiv-ui` / `create-primitiv-ui`) are superseded at v0.1.0 on first real publish.
  - **Decision: manual implementation** (not cargo-dist, not napi-rs). cargo-dist wants to own the release workflow — generating its own `dist.yml` and conflicting with our existing `publish.yml`. napi-rs is for native Node.js addons, not standalone CLI binaries. Manual is what esbuild / Biome / oxc do: per-platform package.json + a 30-line JS launcher. We know every line.
  - **Platform matrix** (RFC §7.3): `darwin-arm64` (`macos-latest`), `darwin-x64` (`macos-13`), `linux-x64-gnu` (`ubuntu-latest`), `linux-arm64-gnu` (`ubuntu-24.04-arm`), `win32-x64` (`windows-latest`). musl is a documented fast-follow. `cargo install primitiv-cli` covers unlisted targets.
  - **npm packages** (in `npm/` directory, outside the pnpm workspace):
    - 5 × `@primitiv-ui/cli-<target>` — each just a `package.json` with `os`/`cpu` guards + the binary (injected at publish time, gitignored).
    - `primitiv-ui` (wrapper) — `bin: primitiv → bin/primitiv.mjs`; lists platform packages as `optionalDependencies`.
    - `create-primitiv-ui` (scaffold) — `pnpm create primitiv-ui` installs `primitiv-ui` then runs `primitiv init`.
  - **`publish.yml`** restructured into two jobs: `build-cli` (5-target matrix, uploads artifacts) → `publish` (downloads artifacts, places binaries, publishes in dependency order: platform packages → wrapper/scaffold → libraries). Detail in `RELEASING.md §2`.
  - **Remaining before first real publish** (phone/web tasks):
    - Transfer repo (see org-transfer checklist above).
    - Configure npm Trusted Publishing for each package on npmjs.com (see `RELEASING.md §2`).
    - Bump all package `version` fields from `0.1.0` when ready to ship, if needed.
    - **Prerequisites:** the org transfer (above) and the `REGISTRY_REPO` const update should land first, since the published binary fetches the version-pinned registry from the transferred repo.

## 🎞️ Motion tokens — landed (code-only DTCG, not Figma-synced)

The full motion scale — durations (`0…1000` ms), the four `cubic-bezier` easings,
and the semantic `motion.duration` / `motion.easing` layer — lives in
`packages/tokens/src/motion.json`, a **code-only DTCG document**: hand-authored,
emitted into the token layer like the other base files, but with **no Figma
collection behind it**. Adopted across the registry stylesheets + the headless
component README animation examples.

**Why code-only (decision).** Figma variables are only FLOAT/STRING/COLOR/BOOLEAN,
so a `cubicBezier` easing has no Figma type and can't round-trip. Durations
*could* be FLOAT vars, but a Figma duration variable can't be bound to any
animation property — it would be documentary-only and a drift risk — so the whole
motion scale is kept code-side rather than split across the Figma boundary. This
also establishes the pattern for **any token Figma can't represent**: give it its
own DTCG file outside the sync's five-file write-set.

**The mechanism that makes it safe.** The token sync overwrites exactly the five
files it pulls from Figma (`primitives`, `palette`, `intent`, `context`,
`interaction`). `motion.json` is a sixth file the sync never writes, so a backup
can't wipe it — the reason easings/durations live here and not in `primitives.json`
/ `interaction.json` (which a backup *would* clobber). The CLI embeds it as a
mode-independent base source alongside `primitives` + `interaction`. If motion ever
needs a Figma presence, easings would have to become `STRING` vars holding the CSS
`cubic-bezier(…)` string (carried by the emitter's string passthrough).

## 🛋️ Elevation / shadow tokens — landed (web + Figma) (RFC 0017)

The two-tier elevation system — a primitive `shadow.*` ramp (multi-layered
box-shadows built with the smoothshadows methodology + 3 shared `shadow.color.*`
alphas) and a semantic `elevation.*` depth hierarchy
(`flat / raised / overlay / floating / modal`) — lives in
`packages/tokens/src/elevation.json`, a code-only base DTCG document embedded by
the CLI alongside `primitives` / `interaction` / `motion`. The emitter gained a
DTCG **`shadow` composite** (`value.rs::format_shadow`, `dtcg.rs::shadow_layers`,
and a generalised `alias.rs::link_aliases` that resolves *every* embedded `{…}`).
Geometry **aliases the existing `space.*` scale**, so shadows emit in `rem` and
only the 3 colours are new. Adopted on **Button** (flat→raised hover lift) and the
**Switch thumb** (`shadow.1`). Workbench specimen at `/elevation`.

**Why mostly code-only (same pattern as motion).** Figma has no composite-shadow
variable type, so the layered `shadow.*` / semantic `elevation.*` composites are
code-only; their Figma form is **effect styles**. Only the 3 `shadow.color.*`
alphas are real Figma variables. Colour is based on `absolute-black` (not the
neutral palette) so it doesn't invert in dark mode — single shared scale for v1.

**Figma work — DONE (2026-06-28).** Built directly through the **writable
Figma-console bridge** (`figma_execute`), not the sync plugin: RFC §5's premise
("the in-session Figma MCP is read-only") no longer holds, and the sync plugin is
being retired in favour of backing variables up as-you-go. So **no `elevationSpec.ts`
/ `bootstrapElevation.ts` were written** — the deviation is logged in RFC 0017 D8.

- [x] **`Elevation` COLOR collection** — 3 `shadow/color/{strong,medium,soft}`
  variables (black at ~8/6/4%), created via the bridge.
- [x] **Effect styles — the full set (10), not just 6.** The raw ramp
  `shadow/1…shadow/5` *and* the semantic `elevation/{flat,raised,overlay,floating,modal}`,
  every layer's `offsetX/offsetY/radius/spread` bound to `space/*` and colour to
  `shadow/color/*`. The full ramp was authored (not the 6 in §5) so the Switch
  thumb can reference a named `shadow/1` style and so Figma mirrors the token system
  exactly. `elevation/*` duplicate the matching `shadow/*` layer stacks (Figma styles
  can't alias each other).
- [x] **Applied (baked-in, RFC §7 model 1)** — `elevation/raised` on the 15 Button
  hover variants (primary/secondary/danger × 5 sizes; link's 5 left flat);
  `shadow/1` on the `Thumb` frame in all 40 Switch variants. Button + Switch
  component descriptions updated (live + `figma-component-descriptions` skill).

**Modal → `elevation/modal` — DONE (2026-06-29).** All 4 `Modal` variants
(`435:10250`) + the Modal Example instances rebound from the hardcoded
`y=8 blur=24 rgba(0,0,0,0.16)` drop shadow to the `elevation/modal` effect style.
Component description updated.

**Next session — apply elevation to the remaining Figma set (RFC 0017 §7).**
**Dropdown/Panel** (`402:18499`, → `elevation/overlay`) still carries a hardcoded
shadow — migrate it to the effect style. Cards/raised surfaces are the candidates
for the **Boolean component property** model (`Shadow`/`Elevated`) rather than
baking in. Update each set's component description afterward.

## 🌫️ Scrim token — landed (2026-06-29); hardcoded alpha is a stopgap

Adding the Modal backdrop (React `Modal.Overlay` + the `<dialog>` `::backdrop`)
needed a dim page-scrim colour, so a **`scrim` semantic token** was added to the
**Intent** collection (`intent.json` light + dark, and the Figma Intent
collection, `VariableID:659:41297`). It's consumed by the new **`Modal/Backdrop`**
Figma component and will back the registry Modal stylesheet's `::backdrop` / overlay.

**Deferred — the value is a hardcoded hex alpha (`#00000080`, ~0.5α black), not a
token alias.** Same stopgap as the `shadow.color.*` alphas: it's `absolute-black`
based (so it doesn't invert in dark mode) and identical in both Intent modes, but
the alpha is baked into the literal because **there is no alpha-channel neutral
ramp to alias yet**. When alpha-bearing neutral ramps exist (a palette/primitive
with per-step alpha), revisit `scrim` *and* `shadow.color.*` together to alias a
real ramp step instead of carrying raw `#rrggbbaa` literals. Until then the literal
is the only option and is consistent with the existing elevation-colour precedent.

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

**Decided during the build (2026-06-12, the Switch slice):**

- **Two kinds of sub-component — decorative *slots* vs structural *parts* (D56).**
  Compound components split into two categories the generators treat differently,
  and conflating them is the trap to avoid:
  - **Decorative slots** — `Switch.Thumb`, `Checkbox.Indicator`, a Select chevron.
    They take *no consumer content*, sit at a *fixed position* in the tree, and
    exist only to be styled/animated. There is exactly one sensible subtree, so the
    styled wrapper **auto-renders** them (the consumer writes one `<Switch>` and
    the thumb comes for free — option A, shadcn parity). This is what the
    contract's `parts` field models, and what `emit_wrapper`'s compound-render path
    fills.
  - **Structural parts** — `Tabs.List` / `Tabs.Trigger` / `Tabs.Panel`,
    `ContextMenu.Item`. Here the composition *is* the consumer's API (which
    triggers, which panels), so there is no canonical subtree to generate. These
    do **not** auto-render: the styled surface is **N thin per-part wrappers**, one
    per part, each applying its BEM part class, composed by the consumer exactly
    like the headless API (the shadcn `Tabs` / `TabsTrigger` / `TabsContent`
    shape). The first structural compound drives this path.
  - **Why picking auto-render for Switch doesn't bind structural compounds.** The
    `parts` schema evolves **non-breakingly** — every contract field to date
    (`dependsOn.components`, `packages`, `prop`, `parts`) landed as a
    `#[serde(default)]` addition. So a structural compound adds a defaulted
    discriminator (e.g. a part `role`/`kind`) and the generator branches on it,
    driven by that real component (D54), *not* speculated now. The "slot" concept
    and the "structural part" concept are orthogonal; teaching the generator one
    does not foreclose the other.

**Structural compounds — landed (Tabs, the first; D56).** The consumption layer
now covers the third component shape. The `primitiv-emit` contract schema grew a
`subcomponents` field (proven on a synthetic `DEMO_VIEW` fixture, D54), and the
recipe + wrapper generators emit **one `cva` per part** and **N thin per-part
wrappers** (`Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`, flat shadcn shape)
the consumer composes — distinct from Switch's auto-rendered decorative slot.
`registry/components/tabs/{contract.json, styles.css, styles.scss, tabs.recipe.ts,
tabs.tsx, README.md}` are committed and drift-guarded, the component is in
`registry.json` + the `EmbeddedRegistry`, and the workbench `TabsExample` gained
contract-styled / justify / density sections. The headless `Tabs.Trigger` was also
aligned to the Button/Switch `data-disabled` convention (`""` / omitted) as part of
this. `size` is the root prop, `justify` the list prop; `Position` is structural
CSS (`:first-child`/`:last-child`), not a prop. **Further structural compounds
(Accordion-style, Menu-style) are now routine application of this mechanism.**

**Prose & inline-mark typography parity — landed (the `prose-base-styles` branch).**
Bringing the CLI / registry / emitted CSS to parity with the Figma prose & inline
marks (PR #206), in three parts:

- **The base element stylesheet (reverses D49 → D60).** `primitiv.reset`, previously
  reserved-but-empty, now carries a global **base element stylesheet**: tokenised
  **bare element selectors** (`p`, `h1`–`h6`, `ul/ol/li`, `dl`, `blockquote`, `hr`,
  `figure`, `code`, `pre`, `kbd`, `a`, `table`, and the inline marks
  `strong/em/mark/del/ins/abbr/small/sub/sup/q`) for prose and typographic marks.
  Bare selectors in the lowest sublayer so a consumer (or any component class) wins
  trivially. Authored in `crates/primitiv-emit/assets/base.{css,scss}`, exposed as
  `primitiv_emit::{BASE_CSS, BASE_SCSS}` (RFC 0008 §2.1/§7/§8 updated).
- **Distributed via `tokens` / `init`.** `tokens` now writes a sibling
  `primitiv-base.{css,scss}` next to the token layer and **prepends `@import
  "./primitiv-base.<ext>";`** to it (CSS/Tailwind share the `.css`, SCSS the `.scss`
  mirror); stdout inlines the base layer. `init` inherits it (it delegates to
  `tokens`). Driven RED→GREEN with unit + on-disk e2e tests; coverage gate holds at
  100%.
- **Styled Table + Divider registry entries.** Both already existed headless in
  `@primitiv-ui/react`; this adds their styled surfaces.
  `registry/components/{table,divider}/{contract.json, styles.css, styles.scss,
  *.recipe.ts, *.tsx, README.md}` are committed and drift-guarded, both are in
  `registry.json` + the `EmbeddedRegistry`, and each has a `data-*` contract guard in
  `packages/react`. **Divider** is a single element styling off `aria-orientation`
  (no class modifier). **Table** is a structural compound (root + 8 part wrappers)
  with an `--xs…--xl` type-scale modifier; cell padding stays density-driven via the
  `table/cell/padding-*` Context tokens (size ≠ density), with hover (auto) and
  `aria-selected` row hooks. No CLI/emit *logic* changed for these (D54 holds — they
  are registry data + drift guards only). Outstanding on the branch: real-browser
  visual QA and the workbench example pages (the base-stylesheet preview + Table /
  Divider pages).

**Spacing & flow rhythm — landed (RFC 0016, the `prose-headless-components` branch).**
A counter-proposal to the block margins the prose-base-styles work put in
`primitiv.reset`: **no default margins**, rhythm is **opt-in**. Three parts:
- **Base margins zeroed (D66).** Every outer block `margin-block`/`margin-inline`
  in `crates/primitiv-emit/assets/base.{css,scss}` is set to a tokenised zero (not
  deleted — there is no upstream reset, so deleting would let UA margins back in).
  Element typography, inline marks, inner spacing, the `li + li` owl and the `dd`
  indent all stay.
- **`flow/*` Context scale (D71).** `tight/normal/section/region` added to all four
  density modes in `packages/tokens/src/context.json`, each aliasing a `space-*`
  primitive, so the emitter produces density-scoped `--primitiv-flow-*`. The Figma
  Context variables are **synced** (2026-06-27), so web and Figma share the scale;
  arranging prose in Figma is the `figma-prose-layout` skill.
- **The `prose` registry component (D74).** `registry/components/prose/` —
  `.primitiv-flow` (a one-directional owl `> * + *` + heading-asymmetry role
  overrides, `@layer primitiv.base`) and a hand-authored `asChild` `<Prose>` wrapper.
  **First registry component with no headless counterpart** — `<Prose>` has zero
  behaviour, so it ships entirely from the registry; the only `@primitiv-ui/react`
  change is **exporting the existing `Slot`** so the wrapper can compose consumer
  elements. Wired into `registry.json` + the embedded registry; `prose.tsx` is
  type-checked by `qa:registry-types` (no drift guard — it is not generated).
  Responsiveness is deferred to RFC 0009 §5 container-query density, which the
  `flow/*` tokens inherit for free (no breakpoint scale exists yet).

**Generated props are `type` intersections, never `interface extends` (D57).**
The wrapper generator's variant-prop branch emitted `interface XProps extends
XPrimitiveProps`. That is a hard TypeScript error (TS2312) whenever the primitive's
props are a controlled/uncontrolled **union** — an `interface` can only extend an
object type or an intersection of object types, not a union — and the broken type
silently dropped inherited members like `children`. It surfaced first on `Tabs`
(`TabsRootProps` is `… & (Uncontrolled | Controlled)`) but `Switch` shared the latent
bug. The no-modifier branch already side-stepped it with a plain `type` alias; the
fix makes the modifier branch emit `type XProps = XPrimitiveProps & { … }` too, so
**every** generated component is a `type` intersection. Intersection distributes over
the union (`(A | B) & M` = `(A & M) | (B & M)`), preserving `children` and the
discriminated controlled/uncontrolled shape. The registry `.tsx` files are
`include_str!`'d into the CLI as strings and therefore **never typechecked in CI**,
which is how this reached a release; the drift-guard tests in `wrapper_tests.rs`
catch generator/artifact divergence but not type validity.

**A forwardRef component's props must omit the DOM `ref`, and the generated
wrappers are now type-checked in CI (D58).** A second type bug shipped right
behind D57: `TabsRootProps` derived from `ComponentProps<"div">`, which carries
`ref: Ref<HTMLDivElement>` — but `Tabs.Root` is a `forwardRef` whose ref is the
`TabsImperativeApi` handle. Using `<Tabs.Root>` directly was fine (the component
type strips and re-adds the ref), but the styled wrapper spreads the **raw**
`TabsRootProps` back in (`<Tabs.Root {...props} />`), and the `HTMLDivElement` vs
`TabsImperativeApi` ref types collide. Fix: `Omit<…, "onChange" | "ref">` on the
root props (any future imperative-handle component needs the same). `Button` and
`Switch` are unaffected — their refs are the real `HTMLButtonElement`. The
**root cause of both D57 and D58 is the same**: the generated wrappers were
type-checked nowhere. Closed by `scripts/check-registry-types.mjs` (`pnpm
qa:registry-types`, wired into `ci.yml`): it copies the wrappers + recipes into a
temp dir under `packages/react` — the only scope where `@types/react` resolves
through pnpm's layout — stubs cva, and runs `tsc --noEmit`. The wrapper file
alone surfaces both bug classes (the `interface extends` at the declaration, the
ref mismatch at the spread), so no consumer fixture is needed.

**Styled wrappers expose the headless API verbatim, `ref` included — props are
derived with `ComponentPropsWithRef<typeof Primitive>` (D59).** The invariant a
consumer can rely on: choosing the styled component over the raw
`@primitiv-ui/react` one changes **nothing** about the API except the added
convenience props (`variant`, `size`, `justify`, …). The generator no longer
imports a named `XPrimitiveProps` type; it derives each wrapper's props from the
part component itself — `type XProps = ComponentPropsWithRef<typeof Primitive> &
{ …conveniences }` — and the wrapper's existing `{...props}` spread forwards the
`ref`. `ComponentPropsWithRef` yields *exactly* the props a consumer passes to
the headless part, with the **correct** ref per pattern: the imperative handle
for `Tabs.Root` (`forwardRef`), the DOM node for `Button` / `Switch.Root` /
`Tabs.Trigger` (ref-as-prop), and whatever the part forwards for `Tabs.List` /
`.Content`. This subsumes D58's manual concern generically — **any future
component, whatever its ref shape, gets parity for free**, no per-part ref
knowledge in the generator. Verified two ways: the D58 type guard
(`qa:registry-types`) proves the wrappers type-check, and a render test confirms
a `ref` passed to styled `<Button>` lands on the `HTMLButtonElement` while a
`ref` on styled `<Tabs>` lands on the `setActiveTab` handle. Works on React 18
and 19 (`ComponentPropsWithRef` predates both). When authoring a new component:
nothing extra to do — the contract drives it; just keep convenience props as the
*only* additions in the contract's `modifiers`.

**Deliberately deferred (answer emerges during the build):**

- **Component focus ring in CSS (system-wide).** *Landed for Button + Switch +
  Tabs.* The shared `:focus-visible` ring is two stacked `box-shadow`s — a
  `--primitiv-surface-default` gap then the `--primitiv-focus-ring` brand ring —
  which auto-follow each control's own radius (so the per-size
  `framed-control/{size}/focus-ring-*-radius` tokens are unnecessary in CSS;
  box-shadow derives R+2 / R+4 for free) and read from the `--primitiv-focus-ring`
  / `--primitiv-focus-ring-width` / `--primitiv-focus-ring-offset` tokens. Button
  and Switch carry a plain outset ring. **Tabs uses option A (accepted for
  today):** the list's `overflow: hidden` (which would crop an outset ring) is
  swapped for per-justify structural corner rounding so the ring escapes and reads
  on the active/brand trigger. Caveat carried forward: the structural rounding
  assumes a stretched tablist (free space for `justify`); a shrink-to-content list
  would poke the un-rounded end corner — revisit only if that case arises.
  - **Still deferred — the composite `--primitiv-focus-ring-shadow` token.**
    Hoisting the box-shadow *recipe* into one shared custom property (so the ring's
    whole structure becomes a single override point) is to be authored
    **Figma-first** (variable → token backup → consume), per the source-of-truth
    direction. The four inputs (colour/width/offset/surface) are already shared
    tokens, so system-wide restyling already works at that level today.
- **`size-size` / `space-space` token-name doubling (Figma-side fix).** The Figma
  variable collections name both the group and the variable `size`/`space`, so the
  DTCG backup → emit doubles to `--primitiv-size-size-*` / `--primitiv-space-space-*`.
  Fix: rename on the **Figma side** so the segment isn't repeated, re-run the
  **token backup**, then update the downstream component references introduced
  alongside the magic-number cleanup — `--primitiv-size-size-80` (Tabs panel
  min-height) and `--primitiv-space-space-0` (Switch padding), plus any others — to
  the de-doubled names. Until the rename + backup land, the doubled names are
  correct and required (they are exactly what the emitter produces today).
- Config-parser fuzzing (RFC 0007 §11.3) — once the parsers exist.
- A `rust-cli-test-conventions` skill (RFC 0007 §11.4) — after the first command.
- Workbench styled-preview shape (RFC 0006 §10.5) — while authoring the theme.
- A first-class CSS Modules emit (RFC 0006 §10.6) — post-v1; no longer blocked.
- `DensityProvider` ergonomics + responsive-density emit shape (RFC 0009 §8.1–8.2)
  — post-v1.
- **Duotone neutral ramps (RFC 0011) — engine landed; plugin rebuild deferred.**
  The colour maths is done in `harmoni-core` / `harmoni-wasm` at 100% (shortest-arc
  hue interpolation across the ramp + a mid-tone chroma `bow` carried on a
  `RampOptions` struct — O1 — and `tint_neutrals_duotone` for the two-anchor blend;
  monotone is the equal-anchor / `bow = 0` special case). The **workbench
  plugin-frame page** (`apps/workbench/src/pages/PluginFrameExample/`) is the single
  iteration surface and ships **Option B** (O2: one source + a bipolar spread slider
  + a bow slider, with live highlight/shadow preview chips). The **actual
  `apps/harmoni-figma-plugin` is deliberately deferred**: once the feature set is
  locked in the workbench, the plugin is **rebuilt from scratch with strong
  ports-&-adapters architecture and strict TDD** (mirroring the `primitiv-cli`
  seam). Its current spread/bow controls + `ColorEngine.test.tsx` are **disposable
  scaffolding**, not maintained in lockstep — the engine crates are the durable
  `{ l, c, h }` / `Palette` contract the rebuild consumes.
- **Component-level JSDoc on the generated styled wrappers (future session).**
  Today the generator emits a JSDoc block (the contract `description` + `@see`)
  on the `export type …Props`, and **per-prop** JSDoc already flows through on
  hover because the props are `ComponentPropsWithRef<typeof Primitive>` (e.g.
  hovering `label` on `<TabsList>` shows the headless prop's docs — D59). What's
  missing is a JSDoc block on the **`export function`** itself, so hovering the
  *component* (`<Tabs>`) surfaces its usage docs. The goal (raised after a
  consumer was caught out by `Tabs.List`'s required `label`): on hover of a
  styled component, show the **styling props first** (`variant`, `size`,
  `justify`, … — the contract `modifiers`), then the headless component's own
  rich JSDoc (examples, keyboard tables, a11y notes). **Open design question —
  where the headless prose comes from:** it lives in the react *source*, not in
  `contract.json`, so the options are (a) embed/sync a `jsdoc` field into the
  contract, (b) a JS pre-generation step that extracts the headless component's
  JSDoc and feeds the Rust emitter, or (c) keep it light — emit the styling-prop
  docs plus an `@see {@link Tabs}` pointer and let the per-prop flow-through carry
  the rest. Applies to **every** generated wrapper — single (Button),
  decorative-slot compound (Switch) and structural (Tabs) alike; for a structural
  compound each part additionally pulls its matching headless part's JSDoc.
  Decide the sourcing approach first.
