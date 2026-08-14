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
   import paths after a rename). It's a legacy iteration surface — new
   component examples go in the **kitchen-sink** instead (decided
   2026-07-25), so don't expand the workbench at all.
6. **Never open PRs unprompted.** "Update the PR description" /
   "create a new PR" are explicit; silence is not.
7. **GitHub interactions: prefer the MCP tools** (`mcp__github__*`)
   when they're connected. When they aren't available in the session,
   fall back to the `gh` CLI. Either way, stay scoped to
   `primitiv-ui/primitiv` and never touch the raw API directly.
8. **Composite / composed components: Figma first, always — never jump
   straight to the registry.** "This composes two ✓ done primitives, so
   there's nothing left to design" is a trap. Composing existing
   components together still surfaces real visual decisions that only
   show up once you're looking at the composition, not before —
   Alert's dismiss button is the reference case: building it in Figma
   first is what surfaced that the icon needed a scalable
   `icon-offset-top` optical-alignment token against the title, that
   the dismiss control should be a real Icon Button instance rather
   than a bare icon (matching the Modal-close convention), and that
   giving it a tone-tinted icon plus a hover/active background needed
   two brand-new token families (`feedback/*/soft/hover`,
   `feedback/*/soft/active`) that didn't exist yet. None of that was
   visible from the component's spec — it only emerged from iterating
   on the composition visually. Work every composite the same way: land
   the Figma component set (or an exploration page for a full
   composite), settle these cross-component decisions and any new
   tokens there, *then* build the registry surface. See RFC 0021 §6 for
   the composite-specific build conventions this feeds into.

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
  - a **kitchen-sink example** in `apps/kitchen-sink` (see the
    `new-registry-component` skill). **Examples live in the kitchen-sink
    now, not the workbench** — decided 2026-07-25. Don't add
    `apps/workbench/src/pages` examples for new components; the workbench
    keeps only the pages it already has.
  - the component's `ROADMAP.md` checkbox ticked `[x]`.

These (test, JSDoc, README — plus, for a new component, the table
row, kitchen-sink example, and roadmap tick) are not follow-ups — they
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
- **NavigationMenu (RFC 0019) dependency build — fully complete (2026-07-25).**
  RFC 0019 needed Dropdown, Collapsible and a richer `Select` headless
  component built out to full Figma → headless → registry → kitchen-sink
  surfaces *before* NavigationMenu itself started, with Figma design done
  first for each. Sequence, all stages done: **Dropdown → Collapsible →
  Select refactor → NavigationMenu.**
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
  - **Select refactor — design settled, Figma landed (2026-07-24); headless
    build landed the next day (see the "Select rich mode" entry below).**
    Decided against a second "Rich Select"
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
    across all 45. A follow-up QA pass then found and fixed a real,
    code-matching design-token gap: dropdown item text barely scaled across
    sizes (`dropdown.{size}.item.font-size`/`line-height` had their own flat
    scale, 11/13/14/15/16px, not even density-sensitive) — aliased to
    `body.{size}.font-size`/`line-height` (the same scale Trigger's own
    value text already used) in `packages/tokens/src/context.json`,
    regenerated `tokens.css`, and mirrored into the matching Figma
    variables. Also attempted an `md`-first reorder on the composed
    `Select` set (`closed, Size=md` moved to child index 0), but
    `ComponentSetNode.defaultVariant` turned out to be **read-only** via the
    plugin API — the reorder only affects children-array/list order, not
    the actual default variant Figma pre-selects (still `xs`), the same
    open limitation already logged on Collapsible. Full account in
    `docs/select-future-work.md`, which also carries the full settled
    Rich-mode decision list (Popover API popup layer, single-select only,
    no scroll buttons/arrow/item-aligned positioning, hidden native
    `<select>` for form submission — the Firefox Popover-API-support caveat
    is now resolved, shipped since Firefox 125). **Composition depth —
    landed in Figma (2026-07-24).** Scope was flagged and chosen: extend the
    *shared* `Dropdown / Item` family (not a Select-scoped row), across all
    three selectable rows (`Item` + `CheckboxItem` + `RadioItem`). Each gained
    `Show leading` / `Show trailing` BOOLEANs + `Leading` / `Trailing`
    INSTANCE_SWAPs (the Button framed-control pattern, NOT a
    variant axis — that would've exploded CheckboxItem 45→135), layout
    `[indicator/gutter][leading][label FILL][trailing]`, both slots off by
    default (backward-compatible). The built-in check/dot indicator stays
    leading (identity); the new leading slot is an additional icon after it.
    `Select / Trigger` already had `Filled` (placeholder↔filled); the third
    content state (filled+leading-icon) landed as a `Show leading`
    BOOLEAN + `Leading` SWAP. **INSTANCE_SWAP needed no manual
    UI step** — `addComponentProperty(…, 'INSTANCE_SWAP', …)` resolves via the
    plugin API, no two-step dance. **Corrected 2026-08-08:** the default value
    must be the component's **`id`**, not its `.key` — `.key` throws
    *"Property value is incompatible with component property type"* for a set
    local to the file. (`preferredValues` is the opposite: it takes `key`.)
    Also corrected a stale claim: `isExposedInstance=true` is a
    no-op via the plugin API (per `figma-framed-control-component`'s
    component-properties reference), so the doc's earlier "exposed Panel Slot"
    note was wrong — formal INSTANCE_SWAP is the working path. Descriptions on
    all four sets + the `figma-component-descriptions` canonical entries
    updated. Verified via a framework-picker composition (Panel → 3
    CheckboxItem rows → per-row leading glyph + checkmark). Slots are
    **general content slots**, not icon-only: `preferredValues` is a curated
    shortlist (broadened to Icon + Avatar + Kbd — all published; Tag/Chip/Badge
    swap in once built) not a whitelist, so any component swaps in via the
    picker. Verified a trailing `Kbd` ("Esc") swap — a non-icon component keeps
    its natural width (not squashed into the icon square). Full account in
    `docs/select-future-work.md`.
  - **Select rich mode — fully landed, all four stages (2026-07-25).** The
    headless build (one compound, two render paths behind `native`; rich is
    the default) reached 100% unit + mutation, then the registry and
    kitchen-sink surfaces landed against a live `figma_execute` dump of
    `Select / Trigger` + the composed `Select` set (read the file, don't
    trust the prose — the dump is what confirmed the trigger is Input's
    geometry exactly, that its value is single-line ending-truncated, and
    that the `Filled` axis is a pure `content/muted` ↔ `content/primary`
    swap). That last point drove one headless cycle: `Select.Value` now
    exposes **`data-placeholder`**, the hook the styled layer keys the muted
    colour off — nothing in the DOM distinguished the two states before.
    Registry `select` = one frame class for both paths with a `mode`
    (`--rich` / `--native`) modifier, where only `--rich` sets `display:
    flex` (a `<select>` with an inner flex layout makes some engines lay the
    `<option>`s out as flex items); the panel + rows resolve the shared
    `--primitiv-dropdown-*` tokens rather than depending on the `dropdown`
    component, so a listbox is a menu by construction with no forced install.
    The mark gutter is reserved **unconditionally** — Dropdown's `:has()`
    trick keys off a row *class* that is always present, but a listbox row is
    one class whether or not it holds a mark and the mark unmounts while
    unselected, so the equivalent would collapse the gutter on first
    selection (`--primitiv-select-item-inset` is the escape hatch).
    Dropdown gained the matching `__item-leading` / `__item-label` /
    `__item-trailing` row slots from the Figma `Show leading` / `Show
    trailing` work. **The kitchen-sink demos need no release** — although
    `apps/kitchen-sink` is excluded from the pnpm workspace and depends on
    the published packages, its `vite.config.ts` + `tsconfig.app.json` alias
    `@primitiv-ui/react` / `/icons` to the workspace **source** precisely so
    unpublished headless work can be exercised, so a docs redeploy surfaces
    them (build with `pnpm exec vite build`, not `pnpm build` — the
    `composite` tsconfig rejects the aliased out-of-tree source with TS6307,
    which is why `deploy-docs.yml` calls vite directly). Only the registry
    half carries the embedded-registry gotcha (CLI rebuild before `primitiv
    add select` serves it). Two pre-existing Figma↔registry drifts were
    flagged but deliberately not changed (focused-trigger border colour;
    `Dropdown / Panel`'s `border/subtle` stroke). Full account in
    `docs/select-future-work.md`.
  - **NavigationMenu — fully landed, all four stages (2026-07-25).** RFC 0019 §4
    is fully settled and §5 fixed the API. Decisions: **(a)** desktop-only
    `NavigationMenu` +
    composed mobile — the duplication worry was raised and closed in
    RFC 0019 **§4a** (the nav *data* and the active-state `Link` stay
    single-sourced; only ~15 lines of wrapper elements differ per
    presentation, and a single shared tree hidden by breakpoint would
    put duplicate landmarks/ids in the a11y tree); **(c)** a
    `NavigationMenu.Link` part is the *only* shared affordance — no
    standalone `Link` primitive, and no nav data model in the library;
    **(d)** the full Radix model, `Viewport` + `Indicator` included.
    Eight parts: `Root` (the `<nav>`, `aria-label="Main"` default, owns
    the open value where **`""` = closed**, `openOnHover`/`delayDuration`
    /`closeDelay`, and the single Escape handler), `List` (`<ul>`),
    `Item` (`<li>` — **its `value` is what makes an entry a disclosure**;
    omit it for a plain link entry, and a Trigger/Content inside a
    value-less Item throws), `Trigger`, `Content` (mounted-with-`hidden`
    per the Collapsible convention, `forceMount` for animation), `Viewport`,
    `Indicator`, `Link`. Three things worth knowing before touching it:
    **(1)** it is the ARIA APG *Disclosure Navigation Menu*, **not** a
    menubar — `useRovingTabindex` is used for its axis/RTL keymap only and
    **no `tabIndex` is manipulated**, so every top-level entry stays
    tabbable (correct for links-to-pages; don't "fix" this into a roving
    tabstop). **(2)** hover-intent has a real trap that cost a cycle: the
    pointer that arrives to *click* fires `pointerenter` first, so with
    hover-to-open the panel opens before the click lands and a naive
    toggle closes it again — the Trigger therefore toggles against what
    was open when the pointer **arrived**. **(3)** `Content` portals into
    a mounted `Viewport` (the same projection `MillerColumns.Column` uses),
    so panels share one morphing box; without a Viewport they render in
    place. `Indicator` measures the open trigger and publishes
    `--primitiv-navigation-menu-indicator-position` / `-size` (re-measured
    on resize), and takes `asChild` so the marker can be an icon rather
    than a styled box. 100% lines/branches/functions/statements.
    **Mutation hardening is landed (106 tests).** NavigationMenu is in
    `mutation-allowlist.json` and holds **100%** — every mutant killed by a
    test bar 9 disabled lines, each with a written equivalence
    justification. Getting there deleted the code behind four mutant
    clusters rather than arguing about them (the hook's duplicate prop
    defaults, the `clearTimeout` null-guards — `clearTimeout(undefined)` is
    a spec'd no-op — the Viewport registrar wrapper, the Indicator's
    redundant closed early-out, and `navigable: enabled ? keys : []`, now an
    explicit no-op handler). Four hard-won testing facts worth reusing:
    **(a)** a state update from a real timer that fires outside `act` is
    *queued, not applied*, so a wait that must observe one has to be
    `await act(() => …)`-wrapped or it reads a stale DOM; **(b)**
    `userEvent` awaits a macrotask between events, which is long enough for
    a 0 ms timer to fire — a **`delay: null` multi-step `user.pointer`
    call** is the only way to keep "opens now" distinguishable from "opens
    next tick" (this is what the surviving `delayDuration === 0` mutant
    turned on); **(c)** any timing test also needs its delay to outlast the
    gap *before* the cancelling action, or a loaded machine wins the race
    and it flakes; **(d)** the Trigger's own `pointerLeave` is unobservable
    through hover alone — `userEvent` sets no `relatedTarget`, so React
    fires the `<nav>`'s leave too and `closeWithDelay` cancels the open
    anyway — a **keyboard** toggle after the pointer has left is what
    exposes it. `userEvent` + fake timers does **not** work in this repo at
    all: RTL's `asyncWrapper` advances fake clocks only via a global `jest`,
    which vitest doesn't define, so every call hangs (hence the real-timer
    approach above, and why the older fake-timer suites use `fireEvent`).
    Stryker's availability is **environment-dependent** — some machines can't
    `pnpm install` it, others have it. Check before choosing a tool
    (`ls packages/react/node_modules/.bin/stryker`): when present, run the real
    thing (`mutate:component <Name>`, ~7 min) and read survivors with
    `node scripts/mutation-survivors.mjs <Name>`; when absent, fall back to
    `scripts/mutate-local.mjs` (`mutate:local <Name>`), which reproduces its
    mutators off the TypeScript AST. The stand-in is an approximation — it
    over-generates and disagrees with Stryker on which mutants exist, so treat
    its output as a guide, never as the gate. See the `mutation-testing` skill. The
    prop-collision scan caught one real narrowing artifact on the way —
    `Item.value` shadows `<li value>` and needed the `Omit`.
    **Figma desktop set landed (2026-07-25)** — five sets on a new
    "Navigation Menu" page (`1333:50772`), 150 variants, all **md-first**
    (building the md variants first is what finally produced a genuinely
    md-first Size dropdown — the thing Collapsible and Select couldn't get
    retroactively, since `defaultVariant` is read-only): `Trigger`
    (`1333:50847`), `Bar Link` (`1333:51136`) + `Panel Link` (`1333:51304`)
    — the two placements of the one headless `Link` part — `Indicator`
    (`1334:51727`, arrow reusing `Tooltip / Arrow` Tone=inverted, plus an
    underline style), and the composed `Navigation Menu` (`1334:51944`).
    Three decisions worth keeping: the panel is a **`Dropdown / Panel`
    instance with its stroke and own shadow overridden off**, with
    `elevation/overlay` moved to a transparent wrapper so the shadow wraps
    arrow + panel as one silhouette — the Tooltip/Popover model, because a
    border would seam across the arrow's base (the registry solves the same
    problem with `filter: drop-shadow`); geometry adopts the
    previously-unconsumed **`nav-item/*`** Context family rather than
    `framed-control/*` (a nav entry isn't a bordered control), extended
    code-first with an `xl` slot + `padding-block`, `text-gap` and
    `panel-offset`; and the Figma↔headless name drift is deliberate and
    recorded in the descriptions (`Content`→`Panel` is the existing house
    convention, and one `Link` part legitimately needs two geometries).
    Arrange script: `apps/harmoni-figma-plugin/scripts/arrange-navigation-menu-component-sets.js`.
    Registry `navigation-menu` (anchor-positioned Viewport panel projection,
    trigger chevron flip, arrow/underline `Indicator` modifiers) and the
    kitchen-sink demo (desktop five-panel disclosure nav — two-column,
    single-column, and a four-column brand-callout panel — plus the composed
    mobile presentation via `Drawer` + `Collapsible` + `NavigationMenuLink`)
    both landed too. Registered in `registry/registry.json`,
    `crates/primitiv-cli/src/ports/registry.rs`,
    `crates/primitiv-cli/tests/cli.rs` (roster count 48).
- **Badge / Tag / Chip (RFC 0021) — fully landed, tokens + Figma + registry
  (2026-07-29).** All three are hand-authored, primitive-less registry
  leaves — no `packages/react` primitive, per RFC 0021's explicit call
  ("as a `prose`-style hand-authored, primitive-less registry leaf").
  Tokens: `color.{success,warning,info}.*` Palette primitives,
  `feedback.{tone}.{soft,solid}.*` Intent (including
  `feedback.neutral.soft.*` for Tag), `badge/*`/`tag/*` Context sizing.
  Figma: Badge (40 variants, Tone×Variant×Size, page "Badge") — its
  originally-shared `Label` TEXT property was split into separate `Label`/
  `Counter` properties after the single-property version made every variant
  default to the same text (Figma properties can't carry a variant-
  conditional default); Tag (25 variants, Tone×Size, no Variant axis, page
  "Tag"); Chip (25 variants, Size×Interaction, page "Chip") — genuinely
  interactive, reuses `framed-control/*` + `action/secondary/*` directly
  instead of a dedicated family, with a `radii/full` pill override and
  Button's exact offset focus-ring anatomy (a first pass copied ToggleGroup
  Item's flush, no-outset ring, which read wrong on a bordered pill).
  Registry (`registry/components/{badge,tag,chip}`): `Badge`/`Tag` mirror
  `kbd`'s zero-behaviour shape (a `cva`-driven `<span>`, `asChild` via
  `Slot`); `Chip` mirrors `code-block`'s real-behaviour shape — a compound
  `[leading icon?][label][remove button]` structure with a required
  `onRemove` (removability is core to the anatomy, not optional), no
  `asChild` (its root isn't a single pass-through child), and its remove
  glyph inlined from `@primitiv-ui/icons`' `Close` so it installs no extra
  package. Chip's Interaction states are drawn on the whole pill even though
  only the nested `<button>` is truly interactive/focusable: `:hover` on
  the root directly, `:active`/`:focus-visible`/`:disabled` via
  `:has(.primitiv-chip__remove:…)`, with the shared two-layer box-shadow
  focus ring (CSS follows border-radius automatically, unlike Figma's
  frame-based ring). Registered in `registry/registry.json`,
  `crates/primitiv-cli/src/ports/registry.rs`,
  `crates/primitiv-cli/tests/cli.rs` (roster count 45). Kitchen-sink: a
  combined "Badge, Tag & Chip" section between Avatar and Breadcrumb in
  `apps/kitchen-sink/src/App.tsx`, Chip's demo backed by real `useState` so
  the remove button actually removes a filter chip from a live list.
- **ConfirmDialog (RFC 0021 Tier 1 composite, `Modal` + `Button`) — fully
  landed, Figma + registry (2026-07-30).** Figma-first per RFC 0021 §6: a
  "Confirm / Alert Dialog — exploration" page (built from real Modal/Button/
  Icon instances) settled tone-follows-the-action, no default leading icon,
  editable labels, and close-button-off-by-default, before the real
  `ConfirmDialog` component set (8 variants, Tone default\|danger × Size
  sm\|md\|lg\|xl) landed on a new "ConfirmDialog" page, positioned right after
  "Modal" in the Overlays section. The body is a genuine Figma SLOT — a live,
  non-detached nested `Modal/Body` instance (preserving its native slot),
  while Header/Footer are detached plain frames with `componentPropertyReferences`
  wired directly to their text/visibility nodes (Modal's own nested-instance
  property exposure — `header.componentPropertyReferences` — was found to be
  genuinely broken/unsettable via the plugin API; detach-and-rewire was the
  workaround, scoped to ConfirmDialog only, not fixed at Modal's shared
  master). Building the slot surfaced and fixed a real shared-master bug along
  the way: `Modal/Body`'s slot was a fixed 80px frame that silently
  overlapped the footer on long content — now hug-with-a-`minHeight:80`-floor,
  benefiting every Modal in the file. **No headless `@primitiv-ui/react`
  primitive** — Modal's own native-`<dialog>`-based focus trap and
  Escape/backdrop dismissal (`packages/react/src/Modal/hooks/useModalContent.ts`)
  already cover everything this needs, so it ships as a pure registry
  composition, hand-authored like `alert`. Registry `confirm-dialog`
  (`ConfirmDialog`/`ConfirmDialogTrigger`/`ConfirmDialogContent`) composes the
  registry `modal` (Content/Header/Body/Footer/Title/Close) and `button`
  components directly — no new dialog anatomy, just `title`/children-as-slot/
  `tone` (`default`→primary, `danger`→danger Confirm button)/`size` (default
  `sm`, smaller than Modal's `md`)/`confirmLabel`/`cancelLabel`/`onConfirm`
  (does not auto-close)/`showClose` (default `false`) as props.
  `contract.json`/`styles.css` carry no new custom properties or modifiers —
  every visual declaration is Modal's own; `.primitiv-confirm-dialog` is a
  reserved, currently-empty identification class. `Portal`/`Overlay` are
  deliberately not re-exported (identical to a plain Modal's — compose
  `ModalPortal`/`ModalOverlay` from `./modal` directly in usage). Registered
  in `registry/registry.json` (`dependsOn.components: ["modal", "button"]`),
  `crates/primitiv-cli/src/ports/registry.rs`,
  `crates/primitiv-cli/tests/cli.rs` (roster count 49). Kitchen-sink: a
  "Confirm Dialog" section right after Modal in `apps/kitchen-sink/src/App.tsx`,
  a controlled danger-tone "Remove member" demo whose `onConfirm` closes the
  dialog.
- **Card (RFC 0021 Tier 1 composite) — fully landed, tokens + Figma + registry
  + kitchen-sink (2026-07-31).** Figma-first per §8. New Context tokens
  `card/{size}/{padding,gap,radius}` + `card-media/{size}/radius-inset` (all 4
  density modes, code and Figma in lockstep). **Five Figma sets** on page
  "Card": `Card` (`1444:37322`, 30 variants — Media None|Top|Side|Top
  Inset|Side Inset|Cover × Size), `Card / Media` (`1444:36867`, 30),
  `Card / Header` (`1464:38775`, 10 — Tone default|inverse),
  `Card / Footer` (`1463:38714`, 15 — Justification Start|Center|End) and
  `Card / Scrim` (`1466:41396`, 3 — Strength soft|medium|strong). Header and
  Footer are their **own sets, nested as live instances**, because the plugin
  API cannot bridge a nested instance's text up to a parent panel (the same
  boundary ConfirmDialog hit): Card's own panel is deliberately just
  `Description` + `Show header`/`Show footer` (a BOOLEAN *can* drive a nested
  instance's `visible`, just not its text), and everything else is edited by
  selecting the nested instance. Footer's buttons are detached (its labels are
  the point); Header's Avatar/Badge are **live** instances (their own props
  matter more than bridging) — opposite resolutions of one API limit, on
  purpose. Registry `card` is **hand-authored and primitive-less** — structure
  and styling only, no keyboard model or focus management, so nothing for a
  `packages/react` primitive to own. Seven parts; `CardContent` owns **all**
  padding (an earlier build gave each region its own and doubled every seam —
  do not reintroduce); the cover scrim is a `::before`, not a component.
  Roster count 50. **Three deliberate Figma↔CSS divergences**, documented in
  both the component descriptions and the stylesheet header, all cases where
  CSS expresses something Figma auto-layout cannot: media absorbs extra card
  height via `flex-grow` (Figma collapses a frame on hug+fill *on the same
  axis* — measured, including that a `minHeight` floor makes hug resolve to
  the max of its children rather than the sum), side media grows via a
  percentage width, and the scrim's stops are **fixed distances from the
  bottom edge** so the wash tracks the content rather than scaling with the
  card. Elevation is a registry-only prop: a Figma BOOLEAN binds only
  `visible`/`characters`/`mainComponent`, so it cannot toggle an effect style,
  and a variant axis would have doubled the set to 60 — a designer needing a
  lifted card in a mockup detaches and applies `elevation/raised` directly.
  Gradient stops **can** bind variables but adopt that variable's own alpha,
  so the scrim's shape comes from stop *positions* (0 / 0.25 / 0.85 / 1) with
  every colour a token; the positions were retuned once against real
  photography after the first shape left only 0.15–0.30 alpha where the title
  sits. Kitchen-sink: a three-column showcase covering all six layouts.
- **Avatar Group (RFC 0021 Tier 1 composite) — fully landed, tokens + Figma +
  registry + kitchen-sink (2026-07-31).** Figma-first per §8: an "Avatar Group
  — exploration" page (10 sections + a settled-decisions panel) fixed every
  choice before the set was built. New Context tokens
  `avatar-group/{size}/overlap` (~30% of avatar diameter) and `/ring-width`
  (~5%) — both **density-aware, and they have to be**: avatar diameter is
  itself density-scaled (`framed-control/{size}/height`, md runs 24/32/40/48
  across modes), so a fixed offset drifts badly at the extremes. Figma set
  `1480:44052` on page "Avatar Group" (40 variants: Size × Count 2|3|4|5 ×
  Direction ltr|rtl) + a `Show counter` BOOLEAN. Registry `avatar-group`
  composes the registry `avatar`; `max` truncates and renders the counter.
  Roster count 51.
  **The counter is an Avatar, NOT a Badge** — Badge ships only
  success|warning|info|danger with no neutral, so it would force a semantic
  colour onto something that is not a status, and a counter Badge is a dot
  beside a 40px avatar. RFC 0021's "overflow badge" wording is superseded.
  **One behaviour, two platform mechanisms.** The first face must paint on top
  AND the counter above everything. Figma needs **two nested auto-layout
  stacks**, because `itemReverseZIndex` is all-or-nothing and a flat list
  buries either the first face (trailing-on-top) or the counter (leading-on-top,
  since it is the last child). CSS has real z-index, so one flat row works with
  a descending inline z-index per face. Do not "simplify" either into the other.
  **The overlap token carries opposite signs on the two platforms, on purpose.**
  DTCG stores it positive, aliased to the space scale, and the CSS negates with
  `calc(-1 * …)`; a raw negative number emits **unitless** (`avatar-group` is not
  in the emitter's `LENGTH_CATEGORIES`) and is invalid for a margin. Figma
  stores it negative, because Figma cannot negate a bound variable — verified
  that a bound *negative* variable does work, which is what keeps the Figma
  component density-responsive rather than a hardcoded literal per variant.
  Also settled: circles only (overlapping squares turn the ring into a notch);
  no spaced variant (positive spacing needs no ring and is just a Stack of
  Avatars); Tooltip is consumer-owned (naming faces would mean owning member
  data, which NavigationMenu explicitly refused, RFC 0019 §4c). The ring is
  surface-coloured to read as a cutout, so it is wrong by construction on any
  other background — `--primitiv-avatar-group-ring-color` is the knob, and it
  must be set **on the group**, not an ancestor (the component re-declares its
  own default, which shadows an inherited value).
- **Breadcrumb Overflow (RFC 0021 Tier 1 composite) — fully landed, Figma +
  headless + registry + kitchen-sink (2026-08-01).** Figma-first even though
  it composes only one existing primitive twice over (`Breadcrumb` +
  `Dropdown`) — "this is just a Breadcrumb variant, no new component needed"
  was flagged and corrected: the composed set (`436:12911`) gained a real,
  selectable `Overflow` false|true axis (10→20 variants), not documentation
  alone. At `Overflow=true` the middle crumb is a bare `Breadcrumb/Item`
  (`State=link`, label `"…"`) with **no fill and no padding** — inherits
  hover/focus/colour/sizing for free from the plain-link treatment, per that
  component set's own description — which is what set the registry trigger's
  entire visual contract below. Headless `Breadcrumb.Ellipsis` landed next: a
  decorative `role="presentation"`/`aria-hidden` glyph, `asChild`-capable,
  defaulting to `"…"`. Breadcrumb still owns no truncation or menu-open state
  of its own (RFC 0019 §4c) — Ellipsis is the composition seam, documented in
  both READMEs with a `Dropdown`-composition example.
  **`keepStart`/`keepEnd`, not a single `maxVisible`** — settled by directly
  asking, since collapsing an *arbitrary* number of crumbs at each end (not
  just "N visible total") is a real, independently-useful axis once you can
  choose it.
  Registry `breadcrumb-overflow` is hand-authored (composes the registry
  `breadcrumb` + `dropdown`, no drift-guard test): takes `children` — plain
  `BreadcrumbLink`/`BreadcrumbPage` elements, not a `label`/`href` data array,
  matching every other compound's refusal to own a data model — and
  re-renders the hidden middle crumbs, **unmodified**, as `DropdownItem
  asChild` children inside the menu, so any `href`, click handler, or
  routing-library `asChild` composition on them keeps working untouched.
  **The trigger deliberately does not compose the registry `Button`** — a
  first pass did, and it visually read as "a secondary button" sitting
  inside a text trail (caught from a real Playwright render, not a review):
  Button's framed-control padding scale is far too heavy against Figma's
  zero-padding spec. Fixed with a bare `<button>` styled by a new `__trigger`
  part, whose padding is cancelled by an equal negative margin (so
  `:hover`/`:active` get a comfortable pill with **zero** layout footprint
  beyond the bare glyph) and a code-only ghost-hover/active affordance (two
  new `--primitiv-breadcrumb-overflow-trigger-{hover,active}-background`
  knobs, borrowing `action/ghost/*` — Figma's static design models no
  interaction state at all here).
  **A second real bug, also caught only by rendering it**: the overflow menu
  opened pinned to the page's top-left corner instead of anchored under the
  trigger, because nothing set a CSS `anchor-name` — the bare `dropdown`
  component leaves that wiring to the consumer, but `BreadcrumbOverflow` can
  appear more than once on a page, so it derives its own unique `anchor-name`
  from `useId()` internally (mirroring NavigationMenu's
  `toAnchorIdentFragment`: `useId()`'s colon-bracketed output isn't a valid
  CSS `<custom-ident>`, so every character outside `[A-Za-z0-9_-]` becomes a
  hyphen) rather than asking the consumer to wire one. Roster count 52.
  Kitchen-sink: a "Breadcrumb Overflow" section right after Breadcrumb — a
  5-crumb trail collapsing to `Home / … / Neuromancer`, beside a 3-crumb
  trail short enough that `keepStart + keepEnd` already covers it (no
  overflow menu appears, confirming the below-threshold fallback).
  Along the way, also fixed two things unrelated to the composite itself but
  found while getting `main`'s CI green: `pnpm qa:stylesheets` had 5 real
  failures (byte-level `styles.scss` drift on `avatar-group`/`card` from this
  session's own earlier regenerations, plus pre-existing drift on
  `checkbox-card`/`confirm-dialog`/`alert`) — the `alert` one was a real
  generator-heuristic gap (it re-points *Button's own* `--primitiv-button-fg`/
  `-bg` custom properties for its dismiss button, which the naive `--name:`
  scss-alias scanner still picks up as if they were Alert's own); and the
  kitchen-sink's committed `tokens.css` had a 411-line duplicate of the
  base-element reset block left over from before `primitiv-base.css` was
  split out as its own `@import`'d sibling — regenerating via `primitiv
  tokens` dropped the stale copy (`primitiv-base.css` itself was already
  current). Both were CI-gating (`qa:stylesheets`, the separate "Token drift"
  workflow) and neither was caused by this composite's own work.
- **Tree — Figma design complete (2026-08-07); registry + kitchen-sink still
  open.** Five md-first sets on page "Tree" (`1583:3`): `Tree / Item`
  (`1590:3`, 25), `Tree / Branch Control` (`1611:13`, 50), `Tree / Connector`
  (`1674:64`, 30), `Tree / Selection Path` (`1733:1215`, 10) and the composed
  `Tree` specimen (`1733:1790`, 5). The headless component was already built
  and untouched; this session added the last two sets, extended Connector, and
  mirrored the token family into code. Design record: the nine-section "Tree —
  exploration" page (`1567:43`).
  - **Selection Path composes Breadcrumb's *parts*, not the composed
    `Breadcrumb` trail** — deliberately, because that is exactly what headless
    `Tree.SelectionPath` renders (`Breadcrumb.Root > List > Item/Separator/
    Page`). Two hard API constraints also force it: `componentPropertyReferences`
    on a node inside a nested instance throws (*"Cannot set component property
    references on instance sublayer"*), so the `Show ancestor` toggles are
    impossible over a composed instance; and exposing a composed `Breadcrumb`
    surfaces only `Size`/`Separator`/`Overflow`, never its segment labels.
    **The registry will reuse `breadcrumb` rather than grow its own path
    anatomy** (settled with the human): a `tree` component declares
    `dependsOn: ["breadcrumb"]` and adds only the `[data-empty]` em-dash and
    the multi-select stacked-trails layout. Tree Size maps to a Breadcrumb size
    **one tier down** (xs|sm→xs · md→sm · lg→md · xl→lg), the same ladder the
    row labels already use.
  - **`isExposedInstance = true` and a `visible` componentPropertyReference are
    mutually exclusive on the same node.** Setting the exposure flag silently
    wipes the ref — *both* then revert, and the write reports success at the
    time it is made, so it only surfaces on a later read. Selection Path's
    `segment-N` wrapper FRAMEs exist purely for this (ref on the frame,
    exposure on the instance inside). This also **corrects the earlier blanket
    claim** in the Select notes above that `isExposedInstance` is a plugin-API
    no-op — on its own it works fine, and is what makes the three segment
    labels panel-editable.
  - **`Tree / Connector` gained a `Target branch|leaf` axis** (15→30 variants)
    after a human review of a rendered specimen. A branch row draws a chevron
    in its leading slot so the stub must stop before that glyph; a leaf leaves
    the slot empty, so its first ink is the icon-or-label at `padding-inline +
    icon-size + gap` — a branch-length stub dies in blank space ~16/17/21/26/30px
    short at xs/sm/md/lg/xl and reads as a broken line. `Target=leaf` ends at
    `indent + icon-size/2`, the right edge of the empty chevron slot, leaving
    the label one row `gap` away. `Style=rail` ignores Target (identical pair,
    kept so the grid stays rectangular). Target maps straight onto the existing
    headless `data-leaf`/`data-branch` attributes, so connectors remain **pure
    registry CSS with zero new headless hooks**.
  - **Clone-drops-refs, third occurrence** (after Dropdown/CheckboxItem and the
    Button ghost variants). All **60 non-md variants** across `Tree / Item` and
    `Tree / Branch Control` had *empty* `componentPropertyReferences` —
    `Label`'s `characters` plus the Icon instance's `visible` + `mainComponent`
    — so those three properties silently did nothing at xs/sm/lg/xl. The panel
    accepted values and `componentProperties` read them back correctly; **only
    a render exposed it.** Re-check refs after any clone-based size expansion.
  - **Resizing a `COMPONENT_SET` before repositioning its children** makes Figma
    re-fit the frame and silently move `set.x`/`set.y` (observed: a set jumping
    x=100 → x=3566), so labels generated afterwards land against a drifted
    origin. `apps/harmoni-figma-plugin/scripts/arrange-tree-component-sets.js`
    captures the anchor first and restores it before generating labels; verified
    idempotent (a re-run produces zero geometry change).
  - **Tokens: 55 `tree/*` Context tokens now in `packages/tokens/src/context.json`**
    (they had existed in Figma only). Only `tree/md/item/{radius,
    focus-ring-radius,focus-ring-gap-radius}` are genuinely density-sensitive;
    the rest are flat across all four modes — an acknowledged placeholder, same
    as when the family was first authored. `tree/{size}/connector/stub-width`
    and `-leaf` are **literal numbers off the primitive ladder** (13, 18, 23,
    34 …) because they derive from chevron-glyph geometry — which is why `tree`
    is now the one component namespace in the emitter's `LENGTH_CATEGORIES`
    (`crates/primitiv-emit/src/value.rs`); without it they emit unitless and are
    invalid as a width, the trap `avatar-group` documents.
  - The composed `Tree` set is **absolutely positioned, not auto-layout**: a
    rail sits at `parentRowX + padding-inline + icon-size/2`, which lands 4px
    *left* of the child row's own left edge at every size, so rails never fall
    on indent boundaries and cannot be auto-layout columns. Its `connectors`
    frame is child 0 so a hovered/selected row's fill covers the rail.
- **Combobox — fully complete, all four stages (2026-08-14).** Figma
  (`1816:61259`, 10 variants, md-first) + the "Combobox — exploration" page
  (`1816:60308`, seven calls, all settled 2026-08-13) landed earlier; the headless
  compound landed after; this session added the **registry surface and the
  kitchen-sink demo**, plus four fixes that only a real browser surfaced (top
  layer, light dismiss, clearing-clears-the-value, and the docs site's component
  list). Full account in `docs/combobox-future-work.md` — §0 for what was fixed,
  §1 for the three headless follow-ups still open (the cursor not scrolling into view is the user-visible one). Four things worth knowing before
  touching it:
  - **No new design tokens, and that is structural.** It falls out of §B1 + §A1:
    the control is **Input verbatim** (`framed-control/{size}/*`, Input's own
    states) and the popup is a **Dropdown panel** at `elevation/overlay`. Revisit
    either and the token cost comes straight back. Rows are `Listbox / Option`
    (not `Dropdown / CheckboxItem`) because Listbox's row is the only one in the
    library with a **cursor** state — so Combobox and Listbox share their entire
    row language on purpose, and a change to one should be checked against both.
  - **The control had to become a wrapper, and this is forced, not a choice.**
    Figma draws one Input frame as `[leading][value FILL][chevron]`, but you
    cannot put a chevron inside an `<input>`. So the frame moved to
    `.primitiv-combobox__control` with a bare field inside, and every state —
    focus ring, invalid, disabled, chevron flip — is read off the inner input with
    `:has()`. Don't "simplify" it back onto the input.
  - **`size` is set once, on the root** — deliberately unlike Select, which
    repeats the axis on trigger *and* content because its root renders no element
    in rich mode. Combobox's headless root is a real `<div>` containing both
    halves, so every knob is declared there and inherits down the DOM; the
    fixed-position panel picks them up too, because custom properties inherit
    through the **DOM tree, not the containing block**. Matches the Figma set's
    single Size axis.
  - **THE PANEL LIVES IN THE TOP LAYER, and getting there took three attempts —
    read `docs/combobox-future-work.md` §0.1 before touching it.** Every failure was
    a real-browser paint bug that no test in this repo would catch. (1)
    `position: fixed` + anchor positioning alone: escapes overflow clipping but
    still competes in the page's stacking contexts, and **the kitchen-sink's own
    disabled-Combobox demo painted over the open panel** (`opacity: 0.5` forms a
    stacking context, later in the DOM). (2) `popover="manual"` + `showPopover()` in
    the *registry wrapper*: did nothing — `manual` popovers have **no light
    dismiss** and there was no `toggle` listener. (3) `popover="auto"` +
    `showPopover()` + a `toggle` listener in the **headless** `Combobox.Content`:
    correct, and the established `useSelectContent` pattern. A `z-index: 1000`
    shipped briefly in between and did fix the overlap; removed once the top layer
    landed, because a top-layer element ignores z-index and a knob that does nothing
    is worse than none. **Two traps left behind:** the `[popover]` UA reset
    (`margin: auto` + `inset: 0` centre it and fight the anchor insets) is NOT
    optional — deleting it visibly misaligned the popup — and `display` must be set
    only under `:popover-open`, an ungated `display` having been tried as a "fail
    open" hedge whose fallback state was itself the broken one. Fail-open only means
    something when the fallback is correct alone.
  - **Light dismiss and clearing, both settled 2026-08-14 after a human tested it.**
    Clicking outside now closes the popup: the browser hit-tests and reports a
    `toggle` event, so there is deliberately **no** hand-rolled pointerdown-outside
    listener, and a dismiss runs the full `dismiss()` rather than only closing.
    **Emptying the field now clears the value** (`onValueChange("")`), guarded so an
    already-empty field fires nothing — exploration §D1 had weighed only "restore the
    value" against "keep the raw query" and never considered that clearing is itself
    a deselect intent. Groups remain **omitted rather than half-shipped**:
    `role="group"` + `aria-labelledby` belongs to the headless layer, as
    `Listbox.Group` already does it.
  - **Two jsdom facts that shape the tests.** jsdom does not wire up the
    `:popover-open` selector, so the UA rule keeps the panel `display: none` and
    every popup role query needs `{ hidden: true }` (Select's suite has the same).
    And on a hidden element, name-from-*content* still resolves but
    name-from-`aria-label` does **not** — so the listbox queries dropped their
    `name` filter and the two-instance ids test indexes `getAllByRole` instead.
    Unmount-while-closed was kept deliberately: it is what preserves "a closed
    combobox has no listbox in the a11y tree" and keeps the closed-state assertions
    meaningful. It is also why the panel can animate in but not out.


## Figma plugin-API gotchas (scripting via `figma_execute`)

Traps that fail *silently* or point at the wrong culprit. Each cost a real
debugging cycle; none is discoverable from the API surface.

1. **Slots: `component.createSlot()`, not `figma.createSlot`.** Probing the
   `figma` global returns `undefined` and makes slots look unavailable — the
   method is on `ComponentNode`. The dedicated MCP tools
   (`figma_create_slot` etc.) may still be blocked (`MCP error -32003`);
   `figma_execute` is the working path. **It ignores its options object**:
   `createSlot({ name, layoutMode, … })` yields a slot named `"Slot"` with
   `layoutMode: "NONE"`, which absolutely positions every child at 0,0 — so
   appended rows stack invisibly and only the last shows. Set `name`,
   `layoutMode`, both sizing modes and `itemSpacing` *after* creation, and
   clear the slot's default `fills`.
2. **`INSTANCE_SWAP` default value takes a component `id`, not `.key`** (see
   the Select notes above). `preferredValues` takes `key`.
3. **`setBoundVariableForEffect` resets `spread` to 0.** A two-layer focus
   ring binds its colours correctly and renders *nothing*; the read-back shows
   `boundVariables` present and `spread: 0`. Re-apply spread onto the returned
   object (`Object.assign({}, bound, { spread })`) — the binding survives.
   Sibling trap, already in the `figma-component-descriptions` skill: a bound
   *paint* keeps a literal `color`/`opacity` snapshot the bind does not fill
   in. Treat every `setBoundVariableFor*` return value as needing its
   non-colour fields re-set.
4. **`addComponentProperty` can partially apply.** A call that throws on one
   property may already have created the earlier ones, so a naive retry leaves
   duplicates (`Label2`, `Show leading2`). Read `componentPropertyDefinitions`
   before retrying and `deleteComponentProperty` the strays.
5. **Text nodes created by script default to `textAutoResize: "NONE"`** with
   whatever height `resize()` set. Figma still *renders* the overflowing text,
   so a page looks right while every node reports a 20px box — which makes any
   overlap/overflow audit meaningless. Set `textAutoResize = "HEIGHT"` before
   measuring.
6. **`resize()` silently flips `primaryAxisSizingMode` to `FIXED`.** The
   costliest trap of the 2026-08-13 session — it bit three times in one sitting:
   it pinned a slot leaf at 1px (which clipped 92 restored text nodes down to a
   faint sliver, while every text node still reported the correct 24px height),
   pinned six freshly-built layout masters at 8px, and squashed a specimen
   frame. Nothing errors and the read-back of the *children* looks right; only
   the parent's height is wrong. After any `resize()` on an auto-layout frame,
   re-assert `primaryAxisSizingMode = 'AUTO'` (or `layoutSizingVertical`).
   Corollary: **never `resize()` a slot to shrink it** — use `minHeight`. An
   empty slot sits at Figma's default 100px; `minHeight` is the only lever that
   makes it collapse *and* still grow with content.
7. **`combineAsVariants` merges identically-named slot properties into one.**
   This is the whole technique for slots + variants, and it is invisible from
   the API. `createSlot()` registers a NEW property per call, so N variants
   built separately give N slot properties — and slot content then does **not**
   survive switching variant (content is an override keyed to the property).
   Name the slot the same string in every variant *before* combining and you
   get one shared property with per-variant layout, content intact across
   switches. This is exactly why `Collapsible` has one `Content` across 20
   variants while `Tabs / Panel` had five (`slot`, `slot2` … `slot5`).
8. **A slot cannot be duplicated by any clone path.** `slot.clone()` returns a
   plain `FRAME` (silently — it litters look-alike frames that no longer
   function), and cloning a whole `COMPONENT` variant drops its slot entirely.
   For a set that already exists and cannot be re-combined, the only fix is a
   **shared slotted leaf component nested as an instance** in every variant —
   the `Card / Slot`, `Tabs / Panel Slot`, `Accordion / Panel Slot` pattern.
   Verified: slot content in a nested leaf survives parent variant switches.
9. **`GRID` layoutMode cannot be applied to Slot frames** (hard error). Native
   CSS-grid auto-layout works on ordinary frames, but never where slot content
   lives — so a faithful CSS-Grid component is impossible in Figma. The
   registry `grid` is mirrored as a wrap-based flex approximation instead
   (RFC 0022; see the `Grid` component description).
10. **What an instance will and won't let you override**, which is what decides
    whether a registry prop becomes a Figma variant or is left native:
    *not* overridable — `layoutMode` (on the root *or* on a slot) and
    `gridColumnCount`; overridable, and variable-bindable — `itemSpacing`,
    `counterAxisSpacing`, `layoutWrap`, `primaryAxisAlignItems` /
    `counterAxisAlignItems`. This is why `Stack` needs only a `Direction` axis
    rather than the 1,440 variants a literal reading of its contract implies.
11. **Broad `findAll` / `.name` reads crash on stale instance sublayers**
    (`"The node (instance sublayer or table cell) with id … does not exist"`),
    especially just after a shared master has changed. It aborts mid-script, so
    earlier writes in the same call have already applied — the
    `addComponentProperty` partial-apply hazard (4) generalised. Walk
    `children` explicitly instead of `findAll`, wrap `.name`/`.children` reads
    in try/catch, and re-check state before retrying.

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
