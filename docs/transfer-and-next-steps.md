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
based (so it doesn't invert in dark mode) and identical in both Intent modes.
**Update (2026-07-06): alpha-bearing neutral ramps now exist** — see the
neutral-alpha section below — but they do **not** unblock this as-is: the
`color.neutral-alpha.*` ramp anchors on the theme's *veil* (soft-black in light,
soft-white in dark), so it deliberately **inverts** between modes, while `scrim`
and `shadow.color.*` are deliberately theme-static. Aliasing them to the inverting
ramp would change dark-mode behaviour; the revisit needs a decision first (e.g. an
`absolute-black`-anchored alpha ramp as a second family). Until then the literals
stand, consistent with the elevation-colour precedent.

## 👻 Neutral alpha ramps + action.ghost state layer — landed (2026-07-06)

The engine's Path-A alpha ramp (`generate_alpha_ramp`: one anchor colour across
ten 50–900 steps while opacity climbs the shared `ALPHA_CURVE` 3%→92%) is now in
the default token output. `palette.json` carries **`color.neutral-alpha.50–900`**
in both themes as `#rrggbbaa` (anchor = the neutral ramp's index-9 veil: light
`#121418`, dark `#e5ecf6`; alpha bytes use the sync plugin's `Math.round(a*255)`
so a backup is a no-op). `intent.json` gained **`action.ghost.hover`** (α 0.10 →
`neutral-alpha.200`) and **`action.ghost.active`** (α 0.14 → `neutral-alpha.300`),
and the registry Button's ghost variant (plus the Modal close, whose
`primitiv-modal__close` class must keep its transition list and hover fill in
agreement with the ghost variant it's composed onto) binds them instead of the
opaque `action/secondary/*` fills — the wash now composites over any surface.

**Figma side (2026-07-06, via the writable bridge):** `color/neutral-alpha/50–900`
in the Primitives / Palette collection (per-mode veil values matching the DTCG),
`action/ghost/hover` + `action/ghost/active` in Intent, and all 20 ghost
hover/active variants of **Button** and **Icon Button** rebound (descriptions
updated). The file resolves the Palette collection through its **Light** mode even
on dark frames (dark Intent variables step-swap instead), and no `neutral-alpha`
light-column step can express the dark theme's white veil — so a **mirror family,
`color/neutral-alpha-inverse/50–900`**, was added (2026-07-07; each mode = the
*opposite* theme's veil: light `#e5ecf6`@α, dark `#121418`@α) and the ghost
Intent variables' Dark modes alias its 200/300 steps. Everything below the
primitives is a reference token — no raw values. Note the dark alias *paths*
still differ between the repo (`{color.neutral-alpha.*}`, resolving through the
dark ramp) and Figma (`neutral-alpha-inverse/*`, resolving through Light) while
the resolved values agree exactly — the same idiom every dark Intent token
already uses for the solid neutral ramp.

## 🫧 `surface/floating` — elevated overlay surface (landed web + Figma, 2026-07-19)

New Intent token **`surface/floating`** in `intent.json` (both blocks): light =
`{color.absolute-white}` (a white card — the shadow does the lift), dark =
`{color.neutral.100}` → resolves to **`#1e2126`** through the dark ramp, one step
off the `#141414` background. Reason: **shadows don't read on dark**, so an
overlay panel that reuses `surface/default` (same colour as the page behind it)
vanishes in dark mode — the fix is elevation *by surface*, a lighter surface
instead of a shadow. The Popover panel **and its pointer tail** bind to it (the
Tooltip escapes the problem — its default tone is an always-contrasting dark
fill). Also added to `intentSpec.ts` (`aliasTo: absolute-white`, `darkAliasTo:
neutral/100`) and the `dark-mode-content.test.ts` theme-tracking list.

Same **Figma vs repo dark-alias-path** caveat as the neutral-alpha ramp above:
because the specimen forces **Palette = Light** on dark frames, the Figma
variable's dark mode is a **raw `#1e2126`** (palette-invariant) so it renders the
elevated dark there too, while the repo aliases `{color.neutral.100}` (resolving
through the dark ramp). Resolved values agree exactly.

**Not yet regenerated / bound** (no local Rust): refresh `tokens.css` with the
**"Regenerate tokens"** GitHub workflow (Actions → Regenerate tokens → Run
workflow → pick a branch), which runs `primitiv tokens` on a runner and commits
the result back (authenticates with `RELEASE_TOKEN` to push past branch
protection, like `release.yml`). A **`token-drift`** CI check re-emits and fails
if the committed `tokens.css` is stale, so it can't silently drift again — a
failure means "run Regenerate tokens", never hand-edit `tokens.css`. The registry
**Popover** is landed and binds its panel + `::after` arrow to
`--primitiv-surface-floating` (borderless, twelve placements via CSS anchor
positioning + `position-try` auto-flip; hand-authored like Modal, kitchen-sink
demo under the "Popover" section). **Tooltip / ContextMenu / Drawer** registry
surfaces are still to come (they compose on Popover's approach). Real-browser
visual QA of the Popover arrow geometry + the `-start`/`-end` `position-area`
alignment is the outstanding item (authored blind — no local render).

**Popover arrow now density-scales (2026-07-20).** The `popover/{size}/arrow-size`
token aliased the same `space` step in every density block — so the arrow scaled
with size but not density, unlike `radius`/`padding`/`gap` (which all shift step
per density). Fixed to mirror the radius/padding shift (dense −2 · compact −1 ·
comfortable 0 · spacious +1): `md` arrow-size is now `space-6 / 8 / 10 / 12` across
dense/compact/comfortable/spacious. Landed in **code** (`context.json` → regen)
**and** the **Figma Context variables** (synced via the bridge). Known gap: the
**Figma Popover/Arrow *component*** uses fixed per-size vector dims (only `fills`
bound) — Figma can't bind a vector's width/height to a variable, and
Side×Size×Density = 64 variants is impractical — so it is size-scaled but
density-invariant (shows the Comfortable arrow at each size). The arrow-size
variable is the density source of truth (the code honours it; the Figma component
approximates it) — documented on the component description, not a bug.

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

## 🔍 Figma ↔ kitchen-sink audit — in progress (started 2026-07-29)

Figma is the source of truth; the kitchen-sink exists to validate it. Every
component gets checked: Figma's per-part token bindings vs what the deployed
kitchen-sink actually renders, measured in a real browser
(`scripts/figma-qa/` — read its README first, it carries the gotchas).

**The arbitration rule (agreed with the human, 2026-07-29):**
- **Figma wins on values.**
- **Code wins where Figma physically can't express something** — theme
  inversion, wrapped text, RTL, inline text flow.
- **Anything else gets flagged, not decided.** Don't silently arbitrate; three
  earlier calls (Figure scrim opacity, Slider thumb fill, the dark-mode ramp
  encoding) were each a judgement that should have been surfaced.

**Deliverable:** a written audit per component — a table of Figma binding vs
rendered value with a verdict per row — reviewed before any batch of fixes.
One component at a time.

### Prose family — the agreed starting set

| Component | Status |
|---|---|
| `inline-code` | ✅ **clean.** Every binding matches, size axis 10/11/13/16/18 (xs→xl) exact, density tracks. Confirms Kbd/inline-code legitimately differ: inline-code binds `code/{size}/font-size`, Kbd binds `body/{size}/font-size`. |
| `divider` | ✅ **audited, one bug fixed.** Colour (`border/subtle` → `#bcc2cb`), 1px thickness, orientation axis and zero radius all match exactly. **Bug:** the component baked in `margin-block`/`margin-inline: space/16`, which Figma does not specify at all — its `Divider` is a bare 1px rule and all ~30 instances across the layout mockups take separation from the **parent auto-layout `itemSpacing`** (0 / 32 / 48 / 56, i.e. contextual *and* density-dependent). The baked margin double-spaced in gap containers (measured **32px** in the kitchen-sink's own demo: 16 gap + 16 margin, no collapsing in flex), couldn't reach 0, and couldn't track density. Spacing now defaults to `space/0`; the knob stays for block-flow contexts. Two non-bugs recorded in the README: thickness resolves via `border-width/1` not Figma's `size/size-1` (identical 1px — token-family choice), and the vertical rule's `display: inline-block` computes to `block` under flex blockification (kept for inline flow). |
| `list` | ✅ **audited, one bug fixed.** Marker colour (`list/marker/foreground` → `neutral-700` → `#363a3f`) exact; `list/item-gap`, `marker-gap` and `indent` all track density exactly (8/8/28 comfortable, 4/8/24 compact, 2/4/16 dense, 12/12/32 spacious); type scale 12/14/16/20/22 × 16/20/24/32/36 across xs→xl exact; markers `•` / `counter() "."`; disabled opacity 0.5. **Bug:** `primitiv.reset`'s `li + li { margin-block-start: list/item-gap }` stacked on the container's flex `gap` — same token both sides, margins don't collapse in flex — so **every gap rendered at 2×** (measured 4/8/16/24 vs a 2/4/8/12 token). Because it stayed proportional it read as a deliberately airy list, not a bug. `.primitiv-list__item` now zeroes `margin-block`. This also made the README's "web rows sit `list/item-gap` apart" claim true — it wasn't before. Confirmed platform differences: `align-items: baseline` vs Figma's MIN (baseline is correct for wrapped items), and `Show Item 5–8` slot booleans (HTML takes arbitrary children). The unbound 2px `ListItem` block padding was already a recorded deliberate difference and still is. **Figma cleanup:** a second, stale `List` component set (`584:6570` — `Type` only, 2 variants, hardcoded `itemSpacing: 4`, zero instances anywhere, and the one throwing "Component set has existing errors") was **deleted** with the human's approval; `586:7300` is now the only `List` set. Bridge gotcha: after `.remove()`, `node.removed` still read `false` and `getNodeByIdAsync` still resolved the node — the authoritative checks are `node.parent === null` plus a document-wide `findAllWithCriteria` enumeration. |
| `figure` | ✅ **audited clean** (one latent pin hardened). Every binding exact: caption `content/muted` `#6f747b`, overlay caption `content/inverse` `#ebebeb`, overlay scrim `surface/inverse` `#202328` **opaque**, media `radii/8` + clip, type scale 12/14/16/20/22 × 16/20/24/32/36, `align` start/center/end, and `figure/caption-gap` tracking density (4/8/12/16) as *both* the below/above gap **and** all four sides of the overlay caption's padding — exactly as Figma binds it. Overlay verified against the old black-strip regression: in a stretched flex row beside a 260px sibling the figure grows to 260 but the caption's bottom stays flush with the media's (offset 0). **Hardened:** the caption didn't declare `font-weight`, so it sat on the reset's `body/sm` while family/size/line-height tracked `size` — invisible today since every step resolves to `regular`, but a latent pin; now a `--primitiv-figure-font-weight` knob across all 5 sizes. Documented platform differences: the caption's bottom corners carry `radii/8` (Figma's caption is square and clipped by the parent Media frame, which a DOM *sibling* can't be), and `Show Caption` is a Figma slot mechanism. |
| `pull-quote` | ✅ **audited clean.** Every binding exact at comfortable: quote `heading/{h5…h1}` in Khand SemiBold at 24/28/32/40/48 × 32/36/40/48/56, `content/primary` `#121418`; mark `content/muted` `#6f747b` at 18/22/28/32/38 — **all five per-size `calc()` ratios match Figma to 4dp** (0.75 / 0.7857 / 0.875 / 0.8 / 0.7917), as do all five mark↔quote gaps (8/8/12/16/20). Centred both axes, `marks` covered by a prop + `data-marks`. Documented platform differences: the 480px width **and** its 24px padding stay deferred until `Container` (both unbound literals; the padding is that card's gutter, not a typographic decision), and — newly written up — **Figma's mark is a fixed vector per Size with nothing bound, so it does not track density**, while the `calc()` here holds the ratio constant in all four modes (md = 0.875 at 16/26/32/52). **Flagged, not changed:** code defaults `marks={false}`, Figma's `Marks` defaultValue is `with` — but Figma variant defaults are unreliable in this file (`defaultVariant` is read-only; `Size` defaults to `xs`, which is certainly not intended), so this needs a human call, not an inference. **Observation, not a bug:** the `heading/*` ramp compresses to 13–18px at `dense` and expands to 20–88px at `spacious`; code and Figma agree exactly in all four modes, so it's the deliberate design — but an `xl` pull quote at `dense` is 18px, barely above body. Any change belongs to the heading scale system-wide. |
| `code-block` | ✅ **audited, one bug fixed.** **Bug:** the type scale was `code.<size>`; Figma binds **`body.<size>`** — verified at the binding level on `601:9607` (Code, Gutter *and* filename all bind `fontSize`/`lineHeight` to `body.<size>`, only `fontFamily` to `font-family/mono`; nothing in the set touches `code.<size>`). Every block rendered a full step small — 13px vs 16px at md/comfortable, 2–4px low across xs–xl, line-height 20 vs 24. The old justification was also factually wrong: it claimed `body/*` isn't density-scoped, and it is. This makes `code.<size>` **inline-code's alone** — the split is deliberate (inline code sits inside body text where mono reads optically larger, so it steps down; a block is standalone, so it takes the body size straight — same reason Kbd binds `body.<size>`). Everything else exact: `surface/subtle` `#d3dae3`, `border/subtle` `#bcc2cb` 1px, `radii/8`, `code/padding` on both the pre and the gutter gap, `space/8` header block padding + `code/padding` inline, `content/secondary` filename, `content/muted` gutter, `content/primary` code, JetBrains Mono. The **tabbed** `Type` is fully implemented and exact — header padding-block zeroed so the tablist owns the top breathing room (8/8/12/12/16 by size), the header's 1px bottom border kept as the ink-bar baseline, and the borrowed tablist's own border suppressed so the baseline isn't doubled. `COPY_SIZE` = xs→xs, sm→xs, md→sm, lg→md, xl→lg, matching Figma's stepping rule exactly. Platform difference: Prism syntax colours via 7 registry-only `--primitiv-code-syntax-*` roles — Figma is deliberately single-colour ("syntax highlighting is the consuming tooling's job"). **Flagged:** `contract.json` declares `subcomponents: []` although the stylesheet header claims the contract covers the `__header`/`__filename`/`__copy`/`__pre`/`__line`/`__ln` parts. |

### The reset-leak bug class — closed, with a standing check

`primitiv.reset` styles bare elements directly. **A declaration on an element
beats an inherited one whatever the layer** (layer order only arbitrates between
declarations on the *same* element), so a component that sets type on its root
and lets a part inherit silently gets the reset's value. Three instances, all
invisible at `md`/comfortable:

- `description-list` — `dt` in Khand not Asta Sans, `dd` in secondary not
  primary, and **`size` inert on both parts**.
- `blockquote` citation — obliqued by the reset's `transform: skewX(-10deg)`
  synthetic italic. `font-style` computes `normal`, so probing it is a false pass.
- `blockquote` quote — pinned to `body/md`, so at `lg`/`xl` the attribution
  rendered *larger* than the quote.

`scripts/figma-qa/size-pin.mjs` now catches the signature. A sweep of 11
components × 5 sizes found no further instances.

**A fourth instance, spacing rather than type** (found auditing `list`): the reset
also spaces bare list items — `li + li { margin-block-start: list/item-gap }` —
and `list` applied the *same token* as flex `gap` on the container. Margins don't
collapse in flex, so every row gap rendered at **2×**. Same mechanism, and the
shared token is what made it look deliberate.

**The reset has exactly three non-zero margins, so the leak surface is closed:**
`li + li` → `list/item-gap` (this was the bug), `dd` → `margin-inline-start:
list/indent`, and `figcaption` → `margin-block-start: figure/caption-gap`. The
latter two are already neutralised — `description-list__details` and
`figure__caption` both declare `margin: 0`, measured at 0 in every density. Those
two `margin: 0` declarations are **load-bearing, not boilerplate**; deleting one
silently doubles a gap.

**Swept all 20 `li`-rendering registry parts; `list` was the only one.** Every
other part either zeroes `margin-block` explicitly (breadcrumb item + separator,
navigation-menu item, all dropdown/context-menu rows) or declares its own intended
margin (the two menu separators). **Two harness lessons worth keeping:**

- A first pass probing each part inside a bare `<ul>` reported **13 of 20**
  leaking. All false: a rule scoped to the component's own container
  (`.primitiv-breadcrumb__list > …`) can't fire without that ancestor. Build the
  real nesting from `contract.json`.
- The two menu separators still flagged, because their own
  `dropdown/separator-spacing` happens to equal `list/item-gap` (8px) at
  *comfortable*. Re-measuring at **dense** (4px vs 2px) and **spacious** (8px vs
  12px) proved the component's declaration wins. When two candidate sources agree
  at the default, measure where they diverge — a single-density probe can't
  attribute a value.

### The container-spacing bug class — closed, one instance

Found on `divider`: a component that reserves **separation from its siblings** as
its own `margin`. It always misbehaves, because that spacing isn't the
component's to own —

- it **double-counts** against a gap-based container (margins don't collapse in
  flex or grid, so gap + margin add),
- it **can't reach 0** for flush layouts, and
- it **can't track `[data-density]`**, since raw `space/*` primitives aren't
  density-scaled — so the one axis Figma varies is the axis it pins.

Figma states the model plainly: separation lives on the parent auto-layout
frame's `itemSpacing`, which is why it can be contextual *and* density-dependent
in a way a baked margin can't.

**The distinguishing test — does the component own its neighbours?** A sweep of
all 42 registry stylesheets found no second instance. Every other non-zero margin
is *internal* and therefore legitimate: floating-panel offsets from a trigger
(`dropdown`/`popover`/`tooltip`/`select`/`context-menu` `*-offset`), separator
spacing *inside* a menu panel (the same shape as divider, but there the panel is
the component and the separator is its part), spacing between a component's own
parts (`description-list` row gaps, `navigation-menu` row text-gap, `prose`'s
flow rhythm over content it owns), `margin: auto` centring, and the `-1px`
sr-only clip. Only a **standalone** component — one whose siblings are not its
parts — can commit this error.

### The SCSS drift class — closed, all 42 guarded

`primitiv-emit`'s `emit_component_scss` is the generator of record, but its Rust
drift guards are **hand-written per component — 19 of 42**. The other 23 drifted
silently. That is how a `table` alias landed in the wrong order and only went red
because someone had happened to write that one's test.

**The rule, exactly:** the CSS body verbatim, then `\n`, then one
`$name: var(--name);` per **declared** custom property — a line whose trimmed form
starts `--name:` — in **source first-appearance order**, deduped, scanned over
*comment-stripped* CSS so a property named only in prose doesn't count.

It is **not** `contract.json` order. `navigation-menu/styles.scss` carried a
comment asserting it was "generated from contract.json's customProperties order",
which is wrong and is exactly the misconception behind the `table` failure — that
comment is now gone (the generator wouldn't emit it either, so it was itself
drift).

`pnpm qa:stylesheets` now ports the generator to JS and checks **all 42** in CI,
which is cheaper than writing 23 more Rust tests. Rust stays authoritative for the
19 it guards; the two must agree, and `table` passing both is the cross-check.
Nine files were brought into line — 4 missing a trailing newline (`box`, `center`,
`prose`, `spacer`), 1 stray comment (`navigation-menu`), 4 alias-order
(`context-menu`, `dropdown`, `select`, `description-list`). No CSS body changed.

**One open question, deliberately not settled** (`CONSUMED_ALIAS_EXEMPT` in the
script). `description-list`, `figure` and `list` each expose aliases for custom
properties their stylesheet **consumes but never declares** —
`$primitiv-figure-caption-gap`, `$primitiv-list-item-gap`, and so on. Those are
**Context tokens that share the component's name prefix**, supplied by the token
layer, and each is listed in the component's `contract.json`. The generator only
scans declarations, so it would not emit them. Either `emit_component_scss` should
also scan `var(--primitiv-<component>-…)` usages, or those three files are
over-exposing tokens the token layer already provides. Deleting them would narrow a
published contract, so the check allows the extra aliases (order and body still
enforced) and says so out loud. Whoever settles it should empty that list.

### The remaining queue — 35 components, ordered by expected yield

42 registry components; 6 audited (the prose family), 1 excluded (`carousel`,
still in progress). The order below is driven by the **bug classes this run
actually produced**, not alphabetically — every confirmed bug so far fell into one
of five, and three of them are cheaply detectable in advance.

**Wave 1 — close out what's already been touched (4).** These had fixes landed
earlier without a full table, so they need confirmation rather than discovery.
Cheapest wins in the queue.

| Component | Why first |
|---|---|
| ~~`kbd`~~ | ✅ **audited, one gap closed.** The split scale is confirmed at the binding level — `fontSize` → `body.<size>`, `lineHeight` → `code.<size>` — matching this build exactly at all 5 sizes (12/14/16/20/22 × 16/18/20/24/28). Colours/geometry exact: `surface/raised` `#e5ecf6`, `border/default` `#a8aeb6` 1px, `radii/4`, `content/primary`, JetBrains Mono. **Gap closed:** `font-weight` was never declared, so a cap inside a `<strong>` rendered at **700** where Figma binds Regular at every size (measured 700 → 400). **New fact on the known padding difference:** `primitiv.reset` dresses a bare `<kbd>` with the *fixed* `space-4`/`space-2`, matching Figma rather than the component's density-scaled `code/inline/padding-*` — so at Dense the component pads 3/1 while a bare `<kbd>` pads 4/2, and at Spacious 6/3 against 4/2. The same cap renders two ways on one page depending on the class. The already-noted Figma rebind should come with a matching reset change so all three agree. **Observation:** the web box is +1px at `sm`/`lg` only — an inline element's box height comes from font metrics, not `line-height`, and a CSS border adds where Figma's INSIDE stroke doesn't; the two nearly cancel. Not worth chasing (making it `inline-block` would make it worse, +2px, and would let the cap inflate the prose line box). |
| ~~`blockquote`~~ | ✅ **audited clean — no change needed.** All three earlier fixes confirmed by measurement. Axes `Tone × Citation × Size` = 20 all covered (`Citation=without` is the absent `cite` prop). Quote **and** citation share one scale at every size — 12/16, 14/20, 16/24, 20/32, 22/36 — exactly Figma's `body.<size>` on both nodes, so D12's "one size axis" holds and the `lg`/`xl` inversion is gone. `quote/body-gap/{size}` = 4/4/8/12/16 exact **and density-invariant** as specified, while `quote/padding-inline` densifies 12/16/20/24. Bar is 3px on the inline-start edge only (other three 0), `border/strong` `#6f747b` / accent `border/focus` `#236ce1`. Quote `content/secondary` `#363a3f`, citation `content/muted` `#6f747b`, Asta Sans, weight 400 both. **The citation is genuinely upright** — `font-style: normal` *and* `transform: none` *and* `display: block`, probed on `transform` because `font-style` alone reports a false pass against the reset's synthetic oblique — end-aligned and full width (width delta 0 against the quote). |
| ~~`description-list`~~ | ✅ **audited clean — no code change.** Both parts on `body.<size>` at all 5 sizes (12/16 … 22/36), so the earlier "`size` inert on both parts" bug is confirmed fixed. Term is **SemiBold (600) at every size *and* density**, matching Figma's pin to the `font-style/semibold` primitive rather than `body.<size>.font-style`; detail is 400. Both `content/primary` `#121418` — the reset's `content/secondary` on `dd` is correctly overridden — and the reset's `dd` `margin-inline-start` measures 0. Stacked rhythm is uniform (term→detail == detail→term) and tracks `row-gap` 1/1/2/3; indent 12/12/16/20; inline is a `max-content 1fr` grid with `column-gap` 16/20/24/32 and `row-gap` = `list/item-gap` 2/4/8/12, detail end-aligned and flush to the right edge (delta 0). **The hand-patched `tokens.css` was verified faithful to `context.json` across all four density blocks** (cargo is unavailable in-sandbox, so it was patched by hand). `align-items: start` vs Figma's pair `CENTER` is the pre-existing documented deviation (identical for single-line, correct for a wrapped detail). **Figma gap found — see the Figma batch below:** the whole `description-list/*` Context family is **absent from Figma's Context collection**, so `row-gap`, `column-gap` and `details-indent` are hardcoded literals there (2 / 24 / 16) that merely happen to equal the code's *comfortable* values. The inline row gap is the one that *is* bound (`list/item-gap`), which is what makes the omission look like an unfinished code-first token addition rather than a decision. |
| ~~`table`~~ | ✅ **audited — one rule fixed, four missing axes flagged.** What matches exactly: cell type `body.<size>` at all 5 sizes, header weight 600 from Figma's `font-style/semibold` pin, caption **size-invariant** at `body/sm` (11/14/14/14 by density — Figma binds `body/sm` on every Size variant), `table/cell/padding-*` 8/4 · 12/8 · 16/12 · 20/16, head rule `border/strong` `#6f747b` bottom, body rule `border/subtle` `#bcc2cb` bottom, selected row `table/row/selected` `#cbe5ff`, cell + header `content/primary`, caption `content/muted`, `border-collapse: collapse`. **Fixed:** the **footer had no rule at all**. Verified at the node level rather than from the description — the Figma Row frames carry no strokes; each has a `Bottom Border` rectangle whose constraint picks the edge, and head/body pin to `vertical: MAX` while **footer pins to MIN (top)** in `border/strong`. Added `--primitiv-table-footer-rule-color` plus a leading-edge rule that also sheds the base cell's trailing rule (Figma draws nothing below a footer). `Table.Footer` exists in the headless layer but is neither styled-for nor demoed, which is why this went unnoticed. **Four axes Figma has and the code does not — real feature work, needs scoping:** `Table.Borders` none\|horizontal\|grid (the code always draws horizontal rules and never vertical ones; `Cell.Right Border` is the grid half), `Cell.Align` start\|center\|end (hardcoded `text-align: start`), `HeaderCell.Sort` none\|sortable\|ascending\|descending (absent entirely, including the icon sized 0.8× the label — 10/11/13/16/18 — and `content/muted` vs `content/primary` per state), and (at the time) `Row.State=striped`, where **`table/row/stripe` was emitted in both themes and referenced zero times** — the clearest sign a token landed and the wiring never did. **Striping is now implemented** on the human's call: a `rows="plain" | "striped"` prop driving a `:nth-child(even)` zebra, so it's table-level rather than Figma's per-row state. It sits in `primitiv.variants` while hover/selected sit in the later `primitiv.states`, so interaction still beats banding — proven on a row that is *both* even and `aria-selected` (the first version of that test used an odd row, where the stripe rule never applies, and proved nothing). It is an **enum, not a boolean**, because `emit_part` writes `defaultVariants` values quoted and a cva boolean variant needs an unquoted `false` — the generator cannot emit a valid boolean modifier today, which is why no generated component has one and `list`'s `indent` lives in a hand-authored recipe. The kitchen-sink demo now also renders a `<TableFooter>` totals row, since nothing exercised `<tfoot>` before. **Also found:** the demo already hand-rolls `Align` and `Sort` with local `ks-table__*` classes, so both remaining axes have proven need and existing styling to promote. |

Also fold in the agreed **`inline-code` `font-weight`** hardening here — it is the
one outstanding item from the prose family.

**Wave 2 — reset-element exposure (13).** The highest-yield class: 3 of the 6
confirmed type bugs came from a part rendering a bare element `primitiv.reset`
dresses directly. Ordered by exposure.

| Component | Reset-dressed elements | Figma surface |
|---|---|---|
| `breadcrumb` | `li`, `ol` | Breadcrumb 10v + Item 10v + Separator 10v |
| `navigation-menu` | `li`, `ul` | 5 sets, 150v |
| `accordion` | `h3` | Accordion 20v + Item 40v |
| `modal` | `h2`, `p` | 4 sets, 16v |
| `drawer` | `h2`, `p` | 16v |
| `popover` | `h2`, `p` | 3 sets, 68v |
| `field` | `label` | 15v |
| `checkbox` / `radio` / `switch` | `label` | 60v / 40v / 40v — near-identical, audit as one pass |
| `dropdown` / `context-menu` | `li` | Dropdown 10 sets 134v; **ContextMenu is only 5v** against a 539-line stylesheet — check whether Figma under-specifies it or it legitimately borrows Dropdown's parts |

**Wave 3 — type ramp + form controls (12).** No reset exposure, but every one
resolves a type ramp, and the ramp choice is what `kbd` and `code-block` both got
wrong. Check *which* ramp Figma binds, at the binding level.

`input`, `textarea`, `input-group`, `select`, `tabs`, `segmented-control`,
`toggle-group`, `tooltip`, `avatar`, `button`, `collapsible`, `progress`, `slider`.

Highest Figma surface here: `button` 125v, `tooltip` 96v, `slider` 80v,
`input`/`textarea`/`select`-trigger 50v each.

**Wave 4 — no Figma counterpart (6).** `box`, `center`, `spacer`, `stack`,
`aspect-ratio`, `prose`. Confirmed absent from Figma (checked by name across all
87 sets), which is correct — RFC 0022's "zero design risk" primitives and `prose`
have no design surface. **Audit these against the RFC and the reset instead**, and
record the absence so a future pass doesn't read it as missing work.

**Wave 5 — Figma sets with no registry component (4).** Not components to build —
questions to answer.

- **`Link` [90v]** — a full Figma set, but RFC 0019 §4c deliberately decided
  against a standalone `Link` primitive (`NavigationMenu.Link` is the only shared
  affordance). Either the set predates that decision or it documents an intent
  that was dropped. Needs a call.
- **`Em` [5v], `Mark` [5v], `Sub & Sup` [10v]** — text-level elements that live in
  `primitiv.reset`, not the registry. Audit the **reset** against them. Ties
  directly to two open items: the `em/i/cite/dfn` synthetic-oblique skew, and
  whether `<var>` should join that selector list.

**Structural Figma findings to decide on** (all read-only so far, nothing changed):

- **Two empty stray components** — `579:5794` and `579:5795`, both named
  "Component", 100×100, no children, no description, **zero instances**, sitting on
  the `---- TYPOGRAPHY ----` divider page. Same class as the stale `List` set that
  was deleted; almost certainly accidental. Safe to remove.
- **`Mark` name collision** — `441:376` (2v, *Logos & Branding* — the brand mark)
  and `612:35492` (5v, *Mark* — the `<mark>` text element). Two unrelated concepts
  sharing one name, so the library picker shows an ambiguous pair. A rename would
  fix it; not a bug.
- **`toggle-group`** has a Figma `ToggleGroup Item` [40v] but **no container set**,
  and **`input-group` has no Figma set at all** — unlike every other compound. Worth
  confirming both are intentional before auditing those two.

### Deferred / flagged, not yet actioned

- **`inline-code` `font-weight`** — renders 400 by inheritance, matching Figma,
  but would inherit 700 inside a `<strong>`. Fold in next time the file is
  touched (agreed with the human).
- **`<var>` in the reset** — left on the UA's `font-style: italic`, so the
  browser synthesises its own oblique while `em, i, cite, dfn` get the house 10°
  skew. Two different fake italics. Should `var` join that selector list?
- **Inline styles in `packages/react`** — the kitchen-sink and registry are now
  clean (bar Progress/Carousel's continuous data style-props, agreed). The
  headless layer still writes some genuine *styling* inline: Table's
  `__scroll-area` (`display; overflow-x; max-width`) and the sr-only `<select>`
  pattern. Different layer from the no-inline-styles rule; worth a pass.
- **Dark-mode ramp encoding** — reviewed and **accepted as-is**; see
  `packages/tokens/README.md` and the `figma-variable-architecture` skill. Do not
  "fix" by ramp index.
