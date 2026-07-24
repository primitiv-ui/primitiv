# Claude working notes for primitiv / harmoni

Onboarding context for a future Claude session. Detailed reference
material lives in on-demand skills; this file holds only what every
session needs.

## Two names, one repo

- **Primitiv** is the product (the design system).
- **Harmoni** is the palette generation engine inside it — the code
  name for what was formerly `primitiv-core` / `primitiv-wasm`.

Engine / Rust / wasm code → `harmoni`. Product, app title, repo
name, README heading, workbench app `<h1>` → leave as `Primitiv`. The
deliberate "Primitiv" references kept after Step B:

- `README.md` branding (the Primitiv logo lockup + tagline at the top)
- Root `package.json` `"name": "primitiv"`
- `apps/workbench/index.html` `<title>Primitiv</title>`
- `apps/workbench/src/App.tsx` `<h1>Primitiv Engine</h1>`

If you're renaming any of these, stop — you're eroding the identity
split.

## Working style — non-negotiable

1. **Strict TDD.** Red → green → refactor. Coverage stays at 100% —
   **lines, regions, and functions** (Rust) / lines, branches,
   statements, functions (TS). A lines-only check is not enough: it
   lets an untested branch through. Drive every branch from a test.
2. **Pure red-green.** No characterisation tests that pass on first
   run. If a test passes immediately, delete it and find a genuinely
   new behaviour to drive.
3. **Small commits.** One per red-green(-refactor) cycle. Don't
   batch unrelated work.
4. **Push little and often.** Short-lived branches over long
   unshared history.
5. **Leave the workbench app alone** unless mechanically forced (e.g.
   import paths after a rename) or adding a **new component**, which
   ships with its own example page (see "Definition of done"). It's
   an iteration workbench, not a production surface — don't expand it
   for anything else.
6. **Never open PRs unprompted.** "Update the PR description" /
   "create a new PR" are explicit; silence is not.
7. **GitHub interactions: prefer the MCP tools** (`mcp__github__*`)
   when they're connected. When they aren't available in the session,
   fall back to the `gh` CLI. Either way, stay scoped to
   `primitiv-ui/primitiv` and never touch the raw API directly.

## Definition of done for any component change

Every behaviour change in `packages/react` ships with:

- A new or updated **test** covering the new/changed behaviour.
- Updated **JSDoc** on affected sub-components, to the docgen bar —
  component-level prose + correctly-placed `@extends`, per-prop
  `@default`/`{@link}`, and the `Omit`-narrowing check (the docs site
  generates prop tables from this source). Rules: `react-component-patterns`
  skill §9.
- Updated component **README** if the change is consumer-facing
  (new props, changed defaults, new patterns, escape hatches,
  gotchas).
- When adding a **new component**, three more things — easy to miss,
  all required before the component counts as "done":
  - a new row in `packages/react/README.md`'s components table,
    linking to the component's own `src/<Component>/README.md`. The
    component README alone is not the index — the table is.
  - a **workbench example** page under `apps/workbench/src/pages` wired
    into the router (see the `workbench-examples` skill).
  - the component's `ROADMAP.md` checkbox ticked `[x]` (and removed
    from the "Workbench examples" backlog if it was listed there).

These (test, JSDoc, README — plus, for a new component, the table
row, workbench example, and roadmap tick) are not follow-ups — they
are part of "done".

## Working efficiency under TDD

- **Commit messages: subject + 1 sentence body, max.** Implementation
  notes belong in JSDoc and tests, not the commit body. Session-id
  footer line is still required.
- **No per-cycle TodoWrite list.** Every cycle is the same shape.
- **One test run per green check.**
  `pnpm --filter @primitiv-ui/react vitest run src/<Component>` is
  enough. Skip full-suite + `--coverage` unless you suspect a
  coverage gap or a regression elsewhere.
- **One- or two-sentence end-of-cycle summary.** The diff is the
  source of truth.
- **Read with `offset` / `limit`** when jumping into a known region
  of a large file.
- **Share fixtures across tests.** Mirror what
  `Tabs.fixtures.ts` does — pure data, no helpers.

## Skills — load on demand

Reference material lives in skills under `.claude/skills/`, covering
React component work, the Rust/wasm engine, Figma (variables,
components, scripts, token sync), and repo tooling gotchas. Each
skill's frontmatter description (with TRIGGER/SKIP conditions) is
injected into every session automatically — do not duplicate or
paraphrase skill content in this file; the frontmatter is the single
source of truth for when a skill applies.

## Slash commands

- **`/scaffold-component <Name>`** — produces the empty file shape
  for a new headless component and commits the RED state. Does not
  bypass the cycle; implementation and docs commits are still
  human-driven.

## Current state

- Steps C, D, A, B and the vocabulary rename are landed.
- `harmoni-core` is pure Rust (3 direct deps: `csscolorparser`,
  `palette`, `serde`); `harmoni-wasm` holds all Tsify/wasm-bindgen
  code.
- The `neutral` module — greyscale/neutral ramps, soft neutrals,
  hue tinting — is landed. See the `harmoni-architecture-history`
  skill.
- `Palette` is a struct (`swatches` + `lightness_curve` + padding /
  `note` metadata), not a `Vec<Swatch>` type alias.
- `packages/react` is the headless component library
  (`@primitiv-ui/react`). Component inventory lives at
  `.claude/skills/new-react-component/_generated/component-inventory.md`.
- **Registry prose family extended** (kitchen-sink feedback session): the
  hand-authored, primitive-less **`inline-code`** and **`code-block`** registry
  components landed (see the `new-registry-component` skill — the end-to-end flow
  for a copied surface: 6 files + `registry.json` + the embedded `FILES` list +
  the `--all` roster test + the `add`-managed barrel + kitchen-sink hand-sync).
  `inline-code` gained a dedicated **`code/*/font-size`** ramp (a notch below
  body) and density-scoped **`code/inline/padding-*`** tokens (Figma + `context.json`);
  `code-block` does Prism highlighting via `prism-react-renderer` themed from
  registry-only **`--primitiv-code-syntax-*`** roles (light + `[data-theme=dark]`),
  with an optional filename/copy header (the copy control reuses the
  `button` component's secondary classes) and a line-number gutter. Also landed:
  **every stylesheet now declares the `@layer` order up front** (RFC 0008 §3.1)
  so a component sheet bundled before the token layer can't invert
  reset↔base — guarded by a test over the embedded registry.
- **The build phase has started** (live checklist:
  `docs/transfer-and-next-steps.md`). New crates: `crates/primitiv-cli`
  (the `FileSystem` port + in-memory fake) and `crates/primitiv-emit`
  (the pure DTCG → CSS emitter). Rust now runs in CI via
  `.github/workflows/rust.yml`, gating the CLI crates at 100% **lines,
  regions, and functions** with `cargo llvm-cov` (regions catch the
  branch a lines-only gate would miss). The **token emitter is complete
  across the three supported formats — CSS (canonical), SCSS, Tailwind**
  (two-tier per-component split and the `primitiv.theme` overrides layer
  included). A TS/JS format was planned and partly built but **dropped
  (D50)**: it inlines values rather than emitting `var()` references, so it
  can't lean on the cascade to resolve theme/density — the three
  cascade-based formats are the set. The `tokens` and `theme` commands and
  the `primitiv.json` config (`config::resolve` / `try_resolve`) are landed.
  The **CLI command surface is now v1 feature-complete**: `init` (incl.
  interactive prompting + `--yes` → emits token layer as its final step),
  `add` (resolve → install → copy the styled surface + React surface +
  `contract.json` → `primitiv.lock` refresh / `--force` / interactive
  overwrite-keep → project wiring → auto-generates token layer when absent →
  **prepends a `import "./styles…css"` line to the tsx wrapper** so the
  component self-imports its stylesheet), `tokens`, `theme`, and `list` (with
  the lock-backed installed column). The registry has three
  adapters behind one port — embedded (baked in), `LocalRegistry`
  (`--registry <path>`) and `HttpsRegistry` (`--registry <url|version>`, a
  blocking `ureq`/rustls fetch from GitHub-raw) — chosen at run time as a
  `&dyn Registry`; the HTTPS fetch path is held at 100% by a loopback
  `TcpListener` test server (no network, no exemption, no test dep). **Only
  Distribution (Step 8) remains.** Decisions landed include category-map number
  units (rem/unitless) and `var()`-reference alias emit for every format.
- **Distribution / publishing has started.** The repo transferred to
  `primitiv-ui/primitiv`; all 10 npm packages + the 3 JSR packages
  (`@primitiv-ui/{react,icons,tokens}`) published at v0.1.0 via tokenless OIDC.
  The JSR **slow-types cleanup** is landed — `--allow-slow-types` removed; every
  exported symbol carries an explicit type (verify with `npx jsr publish
  --dry-run`). Publishing mechanics, the no-slow-types rules, and the
  lockstep-version-bump gotcha live in `RELEASING.md` (§5–6); the live checklist
  is `docs/transfer-and-next-steps.md`.
- **RFC 0010 (OKLCH colour picker) — Phases 1–3 landed.** The Rust/wasm gamut
  API (`max_in_gamut_chroma`, `paint_lc_plane`, `paint_hue_strip`, plus the
  `parse_color` / `describe_oklch` colour bridge) and the controlled workbench
  picker at `apps/workbench/src/OklchPicker/` (driving the brand *and* neutral
  colours on the Color engine page). The picker is pure-TDD at 100% via a
  workbench vitest harness (`apps/workbench/vitest.config.ts`, wasm + canvas
  mocked). **Phase 3 (hardening) is landed** — focusable L×C pad with arrow-key
  nudging + focus ring + live aria-label, numeric-field clamp/round/steps
  (`channels.ts`), text-field soften-on-focus, and the §6 decision (neutral
  white/black anchors adopt the picker; the brand-hue tint is retained as an
  orthogonal blend). **Phase 4 (Display-P3 + painted axis sliders) is landed** —
  a `DisplayP3` colour space + `oklch_to_p3_rgb` in `harmoni-core`, a `Gamut`
  enum threaded through `max_in_gamut_chroma` and the painters (which blit P3
  coordinates in P3 mode), plus `paint_lightness_strip` / `paint_chroma_strip`
  for the new L/C tracks; on the picker side a `display-p3` canvas blit, four-
  chart + gamut repaint gating, dual sRGB/P3 boundary curves on the pad, a
  generic painted `AxisSlider` (replacing `HueSlider`) for all three axes, and a
  `GamutToggle` composing the headless `ToggleGroup`. Gamut is **internal picker
  view state**, so the controlled `{ l, c, h }` contract is unchanged. Alpha is
  deliberately out (opaque OkLCH). **Phase 4b (the three-chart net) is landed** —
  the full oklch.com editor: `paint_ch_plane` (hue×chroma at fixed L, the Lightness
  chart) and `paint_lh_plane` (hue×lightness at fixed C, the Chroma chart) join
  `paint_lc_plane` (the Hue chart); the bespoke `LcChart` is generalised into a
  reusable **`PlaneChart`** (axis-generic `geometry.ts`, gamut-clamped cursor,
  shared crosshair guide lines), `useGamutPaint`/`repaint` now drive **six**
  canvases (3 charts + 3 slider tracks), and `OklchPicker` lays each chart above
  its matching slider. **Hue is the horizontal axis** on the new charts — verified
  against the `evilmartians/oklch-picker` source (the task's prose had it
  vertical) and confirmed with the human; the painted 1-D sliders stay (chart +
  slider per axis, per oklch.com). The **real-browser visual QA pass is the one
  outstanding item** (no browser in the sandbox). A **Phase 4b follow-up** then
  landed on human feedback: the charts are now a wider **2:1 landscape** that
  fills its container responsively (a `useElementSize` ResizeObserver hook +
  single stacked column, like oklch.com) and paint at **`devicePixelRatio`-scaled
  resolution** (`renderDimensions`) so they're crisp on HiDPI — the `{ l, c, h }`
  contract is unchanged. A **second follow-up** then reworked the layout to match
  oklch.com: charts ordered **Lightness → Chroma → Hue** with each channel's white
  title + number field **above** its chart, the title/slider/field re-paired with
  the correct plane (**Lightness = L×C ramp**, Chroma = hue×C, Hue = hue×L — they
  were crossed), and **L/C/H axis labels** that ride the (difference-blended) guide
  lines and sit just outside the plotting box. A **third follow-up** then fixed the
  Hue-chart bottom-edge spikes at their engine root: `api/gamut.rs`'s
  `linear_in_gamut` tolerance was loosened (`±1e-3`) enough to admit out-of-gamut
  near-black colours, so `max_in_gamut_chroma` reported a spurious near-black chroma
  bump that the boundary's peak-band latched onto; tightening it to float scale
  (`1e-5`) collapses the gamut to the black point, killing the spikes while leaving
  every genuine boundary pixel-identical (and removing the faint near-black gradient
  sliver too — one source of truth, shared with the plugin via wasm). The plugin port
  (Phase 5) follows.
  See RFC 0010 §10.
- **Neutral alpha ramps + ghost state layer — landed (web + Figma, 2026-07-06).**
  `color.neutral-alpha.50–900` in `palette.json` (both themes; anchor = the
  neutral ramp's veil — `#121418` light / `#e5ecf6` dark — with the engine's
  `ALPHA_CURVE` opacities as `#rrggbbaa`), `action.ghost.hover/active` in
  `intent.json` aliasing its low steps, and the registry Button ghost variant
  (plus the Modal close, which composes it) bound to the new roles. Figma has
  the matching Palette + Intent variables and rebound Button / Icon Button
  ghost variants. Because the file resolves the Palette collection through
  Light mode on dark frames, a **mirror family `color.neutral-alpha-inverse.*`**
  (each mode = the opposite theme's veil) exists for Figma's dark Intent
  variables to alias — only primitives carry raw values; everything else is a
  reference token. Details + the scrim/shadow.color revisit caveat in
  `docs/transfer-and-next-steps.md`.
- **RFC 0017 (elevation / shadow tokens) — landed (web + Figma).** A
  two-tier system mirroring motion: a primitive `shadow.*` ramp (multi-layered
  box-shadows, smoothshadows method, + 3 shared `shadow.color.*` alphas) and a
  semantic `elevation.*` depth hierarchy (`flat/raised/overlay/floating/modal`),
  in code-only `packages/tokens/src/elevation.json`. The emitter gained a DTCG
  **`shadow` composite** (`value.rs::format_shadow`, `dtcg.rs::shadow_layers`, and
  a generalised `alias.rs::link_aliases` resolving every embedded `{…}`). Geometry
  aliases the existing `space.*` scale, so only the 3 colours are new; colour is
  `absolute-black`-based so it doesn't invert in dark mode (single shared scale,
  v1). Adopted on Button (flat→raised hover lift) and the Switch thumb
  (`shadow.1`); workbench specimen at `/elevation` (with a light/dark toggle).
  **Figma side built 2026-06-28 via the writable Figma-console bridge (NOT the
  sync plugin — D8):** an `Elevation` COLOR collection (3 `shadow/color/*`) + the
  **full effect-style set (10)** — raw `shadow/1…5` *and* semantic
  `elevation/flat…modal`, every layer bound to `space/*` + `shadow/color/*`. Baked
  in (model 1) on the 15 Button hover variants (link excluded) and all 40 Switch
  thumbs; both component descriptions updated. **Next:** apply elevation to the
  remaining Figma sets with hardcoded shadows — Modal (`elevation/modal`),
  Dropdown/Panel (`elevation/overlay`). See RFC 0017 §5–7 + D8 and
  `docs/transfer-and-next-steps.md`.
- **NavigationMenu (RFC 0019) dependency build — in progress (2026-07-24).**
  RFC 0019 needs Dropdown, Collapsible and a richer `Select` headless
  component built out to full Figma → headless → registry → kitchen-sink
  surfaces *before* NavigationMenu itself starts, with Figma design done
  first for each. Sequence: **Dropdown (done) → Collapsible (done) →
  Select refactor (design settled, Figma landed, headless build not
  started) → NavigationMenu (not started)**.
  - **Dropdown — fully landed, all four stages.** Figma: `668:42210`
    (Panel set) + Item/CheckboxItem/RadioItem/SubTrigger/Label/Separator/
    Group/RadioGroup sets on canvas `317:362`, using a menu checkmark/dot
    indicator model (not embedded Checkbox/Radio controls — a design
    mistake caught and fixed across 75 variants) and an "Inset gutter"
    boolean on Item/SubTrigger/Label so rows align whether or not the
    panel mixes indicator and plain rows. Registry: `dropdown` (anchor-
    positioned menu; `--primitiv-dropdown-row-inset` custom property gated
    by `:has()` for the same gutter behaviour in CSS; `--primitiv-dropdown-
    padding-inline` on the panel). Kitchen-sink: a 3-level nested-menu demo
    (`apps/kitchen-sink/src/App.tsx`, placed right after Button — a
    bottom-of-page position broke submenu flip-fallback positioning).
    Registered in `registry/registry.json`, `crates/primitiv-cli/src/ports/
    registry.rs`, `crates/primitiv-cli/tests/cli.rs` (roster count 21).
  - **Collapsible — fully landed, all four stages.** Figma: new
    "Collapsible" page (`1207:42772`) holds a `Collapsible / Trigger`
    component set (`1207:43048`, 30 variants: Variant[plain|card|inline] ×
    State[closed|open] × Size[xs-xl], md first/default) and the composed
    `Collapsible` set (`1207:43244`, 30 variants, each instancing the
    size-matched Trigger — the composition requirement), with a `Content`
    SLOT property (20 open/inline variants), an exposed `Label` TEXT
    property, and (on `inline`) the clipped-preview fade kept *outside*
    the slot so replacing slot content doesn't remove the fade affordance.
    **Known caveat, still open:** only the default/first-*child* variant
    is md — the Size property's dropdown list in Figma's UI still lists
    xs→ascending (Figma orders that list by variant *creation* order, not
    child order); a true md-first list needs a full rebuild. Also still
    outstanding in Figma: example specimens (light/dark) and component
    descriptions on the new sets — deferred, non-blocking. Headless:
    `collapsedHeight` landed on `packages/react/src/Collapsible` (a
    `--primitiv-collapsible-collapsed-height` custom property published
    on `Collapsible.Content`, clamped/anchored by the styling layer — see
    its README). Registry: `collapsible` (root + `Trigger`/`Content`/
    `TriggerIcon`, the same `display:grid` 0fr↔1fr row-track technique as
    Accordion, generalised so the closed track targets
    `var(--primitiv-collapsible-collapsed-height, 0fr)` — 0fr unless
    `collapsedHeight` is set, in which case the same mechanism clamps to a
    preview height instead of closing to nothing; a `.content-fade`
    overlay reads over the clamp and fades out on open). Three dressings
    (`plain`/`card`/`inline`) confirmed against live Figma dev-data via a
    background research pass (a `figma_get_component_for_development` dump
    of both component sets, extracted by a subagent since the raw JSON was
    >100K chars each): `card`'s box is one shared bordered/radiused/filled
    frame around both Trigger and Content (not two separate boxes), its
    border-color is `border/default` (confirmed by exact hex match against
    `neutral-300`, not `border/subtle` as first guessed), and its
    trigger↔content whitespace gap collapses to 0 in favour of a hairline
    seam (`border/subtle`) on the trigger's bottom edge, present only when
    open. A new density-scaled `collapsible.trigger-padding-block` Context
    token (`packages/tokens/src/context.json`, values 12/14/16/20 across
    dense/compact/comfortable/spacious) was added to back the trigger's
    block padding, mirroring `accordion.trigger-padding-block` exactly
    (its comfortable/md value, 16, is independently confirmed by the Figma
    dump). Every other token binding (label/body type, framed-control
    padding-inline/gap/icon-size/radius, content/primary/secondary,
    surface/default, action/link/foreground/*) matched the pre-existing
    semantic-token guesses exactly, pixel/hex for pixel/hex. Registered in
    `registry/registry.json`, `crates/primitiv-cli/src/ports/registry.rs`,
    `crates/primitiv-cli/tests/cli.rs` (roster count 23; segmented-control
    landed in between via a separate, already-merged session). Kitchen-
    sink: one collapsible per dressing right after the Accordion section,
    the `inline` one demonstrating `collapsedHeight={72}` + the fade.
  - **Select refactor — design settled, Figma landed (2026-07-24);
    headless build not started.** Decided against a second "Rich Select"
    component: `Select` gains a `native` boolean prop (default `false`)
    instead. `native={false}` (the new default) is the rich Popover-API
    listbox (`Select.Content`/`Item`/`Group`/`ItemIndicator`, custom item
    rendering, icons, indicators); `native={true}` is today's shipped thin
    `<select>` wrapper, kept for flat/OS-native cases. Composition
    converges but doesn't unify perfectly: under `native`, `Select.Item`
    keeps only its string/number children (joined as the real `<option>`'s
    text) and drops every element child (icons, indicators don't render) —
    the inverse of the `Children.map` text-vs-element split Button/
    Accordion/ToggleGroup already use; `Select.Group`'s label is a plain
    string prop, not JSX children, sidestepping the same extraction problem
    for groups entirely. No backward-compat path needed —
    `@primitiv-ui/react` isn't releasing again imminently, so flipping the
    default outright is fine. Rich value display settled too: a
    `Select.Value` sub-component (Radix-shaped) auto-mirrors the selected
    `Select.Item`'s children via a shared item collection (the same
    `useCollection` pattern as Tabs/RadioGroup), excluding
    `Select.ItemIndicator` from the mirror, so icons/badges on an `Item`
    show up in the closed trigger without duplication. **Figma design has
    landed**: the existing `Select` set was renamed `Select / Trigger`
    (no behaviour change, matching the `Collapsible / Trigger` precedent),
    and a new composed `Select` component set (`Variant` closed|open ×
    `Size` xs-xl, 10 variants) instances the size-matched Trigger and, when
    open, stacks a **real (non-detached)** `Dropdown / Panel` instance
    populated via its own `Slot` with 3 `Dropdown / CheckboxItem` rows,
    with the Trigger's value text, the Panel instance, and all 3 rows
    exposed as editable nested instance properties. **A genuine SLOT
    property works**, landed in a follow-up pass: the dedicated Figma
    slot-creation MCP tools (`figma_add_slot_property`/`figma_create_slot`/
    `figma_append_to_slot`/`figma_get_slots`) stayed permanently blocked
    (`MCP error -32003`) even after a fresh pairing, but `figma_execute`
    (raw plugin-API scripting) writes into `Dropdown / Panel`'s existing
    `Slot` property with no approval gate at all — rebuilding Select's open
    variants around a live Panel instance and setting
    `isExposedInstance=true` on it promotes that Slot up through the
    exposed-instance chain, so a top-level `Select` instance's property
    panel gives direct native add/remove/reorder access, no detaching
    needed. Two real bugs found and fixed along the way: `Dropdown /
    Panel`'s `Slot` frame was `layoutMode: NONE` with a stale `FIXED`
    height (same class as the earlier `Dropdown / Separator` fix, now
    `VERTICAL`/`HUG`), and `Dropdown / CheckboxItem`'s Label text was only
    bound to the Label property on the 9 md-size variants — all 36
    xs/sm/lg/xl variants had an unbound static "Option" string, now fixed
    across all 45. Full account in `docs/select-future-work.md`, which also
    carries the full settled Rich-mode decision list (Popover API popup
    layer, single-select only, no scroll buttons/arrow/item-aligned
    positioning, hidden native `<select>` for form submission — the
    Firefox Popover-API-support caveat is now resolved, shipped since
    Firefox 125). Next: the headless TDD build in
    `packages/react/src/Select`, then registry + kitchen-sink.
  - **NavigationMenu itself — not started.** RFC 0019 §4 open decisions
    (the fork, mobile interaction model, shared affordances, desktop
    specifics) need settling before scaffolding a headless build, which
    is then followed by Figma design and a kitchen-sink dogfood covering
    both desktop and mobile.

## Useful commands

```sh
cargo test --workspace                            # all Rust tests
# CLI-crate coverage gate — the exact check CI runs (lines+regions+functions):
cargo llvm-cov --workspace --exclude harmoni-core --exclude harmoni-wasm \
  --fail-under-lines 100 --fail-under-regions 100 --fail-under-functions 100
pnpm --filter @primitiv-ui/react qa:units            # React tests + coverage
pnpm --filter @primitiv-ui/react exec vitest run src/X    # scoped, during a cycle
pnpm run build:wasm                               # rebuild wasm pkg
pnpm run dev                                      # workbench dev server
node scripts/bump-version.mjs 0.x.y              # bump all 13 version fields atomically
```

## Releasing

Never bump versions by hand — always use `scripts/bump-version.mjs`. The
two-step release path:
1. **Actions → Release → Run workflow** (enter target version) — bumps, commits, tags, creates the GitHub Release.
2. **Actions → Publish packages → Run workflow** (on `main`, no inputs) — builds CLI binaries and publishes to npm + JSR.

Step 2 is always a manual dispatch. GitHub's GITHUB_TOKEN loop-prevention blocks the `release: published` event from propagating to `publish.yml` when the release is created by an automated workflow. Full details and gotchas are in `RELEASING.md §5`.

**Embedded registry gotcha:** every file under `registry/components/` is
baked into the CLI binary at compile time via `include_str!`. A version bump
alone does NOT surface registry changes to consumers — the CLI binary must be
rebuilt. `publish.yml` always rebuilds, so the automated workflow is always
correct. Never tell a user a registry change is live until a new CLI version
has been published via the workflow.

Don't use raw `grep`/`find`/`rg` from Bash when the Grep and Glob
tools fit. Don't run `find` from `/`.
