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

- `README.md` heading (`# Primitiv`)
- Root `package.json` `"name": "primitiv"`
- `apps/workbench/index.html` `<title>Primitiv</title>`
- `apps/workbench/src/App.tsx` `<h1>Primitiv Engine</h1>`

If you're renaming any of these, stop — you're eroding the identity
split.

## Working style — non-negotiable

1. **Strict TDD.** Red → green → refactor. Coverage stays at 100%.
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
7. **GitHub interactions go through MCP tools** (`mcp__github__*`),
   not `gh` or the raw API. Scope is restricted to
   `simonrevill/primitiv`.

## Definition of done for any component change

Every behaviour change in `packages/react` ships with:

- A new or updated **test** covering the new/changed behaviour.
- Updated **JSDoc** on affected sub-components.
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
  `pnpm --filter @primitiv/react vitest run src/<Component>` is
  enough. Skip full-suite + `--coverage` unless you suspect a
  coverage gap or a regression elsewhere.
- **One- or two-sentence end-of-cycle summary.** The diff is the
  source of truth.
- **Read with `offset` / `limit`** when jumping into a known region
  of a large file.
- **Share fixtures across tests.** Mirror what
  `Tabs.fixtures.ts` does — pure data, no helpers.

## Skill index — load on demand

Skills are not loaded until you trigger them. Reach for them by
keyword or by topic; do not paraphrase their content here.

- **`react-component-patterns`** — Slot/asChild, createStrictContext,
  useControllableState, useCollection, useRovingTabindex, deriveId,
  data-* styling surface, React 19 ref-as-prop.
- **`react-test-conventions`** — concern-based file split, userEvent
  v14 conventions (and the `" "` vs `{Space}` gotcha), fixture
  layout, scoped vitest invocation, coverage exclusions.
- **`new-react-component`** — scaffold playbook for a new headless
  component. Stops at the RED commit. References generated
  inventories under `.claude/skills/new-react-component/_generated/`.
- **`harmoni-architecture-history`** — Steps C/D/A/B, ColorInput,
  mirror-types pattern, vocabulary rename, the neutral module.
  Historical reference.
- **`dark-mode-palettes`** — the anchored two-segment dark
  generation model, `generate_dark_palette` / `generate_pair` /
  `PaletteSet`, and the work deferred past v1.
- **`rust-wasm-workflow`** — cargo commands, api module boundary,
  mirror-types add-a-field checklist, opaque Palette extern type.
- **`sandbox-gotchas`** — git mv cross-device, wasm pkg-not-found,
  broken `build:core`, missing wasm-pack, deleted Playwright e2e.
- **`workbench-examples`** — authoring `apps/workbench` example pages:
  folder layout, router wiring, and the global-CSS-bundling gotcha
  (every example's SCSS is bundled globally — scope every selector).
- **`figma-token-sync`** — how the
  `apps/primitiv-sync-figma-plugin` and `packages/tokens` stack
  backs up Figma variables as DTCG JSON: features, Live sync vs
  download flow, the `dtcg.ts` collection routing (now handles the
  unified multi-mode `Context` collection), and where removed code lived.
- **`figma-wireframe-tokens`** — token file locations (`packages/tokens/src/`),
  resolved colour/typography/radii values, Button component variant naming,
  slot property keys, and the pattern for replacing a flat node with a real
  component instance. TRIGGER when placing or styling components in Figma
  wireframes, looking up token hex values, or working with the Button component.
- **`figma-console-scripts`** — how to generate and run one-shot
  wireframe scripts in the Figma developer console: the "allow pasting"
  step, Plugin API access, font loading, the end-to-end process for
  turning a UI description into a working script (requirements →
  constants → helpers → render layers), design tokens, and the
  `scripts/` convention in `apps/harmoni-figma-plugin/`.
- **`figma-variable-architecture`** — the Figma variable collection
  hierarchy, the unified `Context` collection (4 modes: Dense/Compact/
  Comfortable/Spacious, ID `369:31958`, default=Compact), the `framed-control/*`
  anatomy token set, resolved values for every size slot (xs–xl) in all 4 modes,
  the focus ring radius formula (R+2 gap / R+4 ring), the canonical focus-ring
  build recipe, the text-style mode-override constraint (TextStyle has no
  `setExplicitVariableModeForCollection`), the unified `Intent` collection
  (2 modes: Light/Dark — aliases into `Primitives / Palette` which also has
  Light/Dark modes), `color/white` and `color/black` anchor variables, and
  the `color/white` rule (use for foreground-on-colour, not `color/neutral/50`).
  Also: the `surface`/`border`/`content` families used by non-action controls
  (Input/Field, no intent axis), the danger-semantic tokens (`border/invalid`,
  `content/error`), the font-resolution gotcha (`sans`=Khand, `serif`=Asta Sans —
  both sans), and the typography resolvedType gotcha (`font-weight` is FLOAT).
  TRIGGER when adding new variables, binding layer properties to tokens,
  extending framed-control to a new component, debugging focus ring geometry,
  picking a token for a form-input control, or working with text styles and mode overrides.
- **`figma-framed-control-component`** — end-to-end *playbook* for building or
  extending a framed-control component set in Figma (Button, Switch, Checkbox, …):
  pre-flight, anatomy, clone-and-rebind to add a variant/fill gaps, component-
  specific `{component}/` tokens in the unified Context collection, auto-layout
  for token-driven dimensions, incremental audit loop, arrange + default-instance,
  verification, and build-time gotchas. **Density is frame-owned** — do NOT set
  explicit mode overrides on component variants (breaks consumer frame switching).
  Also covers component-property wiring (booleans/text/INSTANCE_SWAP), the
  **exposed-nested-property limitation** (`isExposedInstance` is a no-op via the
  API — a clean top-level glyph dropdown is UI-only; the swap popover is the
  scriptable ceiling), the single-shared-default TEXT-property rule, and
  **non-framed compositions** (Field: vertical label + nested-control + helper,
  state-coordinated nested instance, `content/*` colours). TRIGGER when
  building/extending/laying-out/auditing a framed-control OR a form-field
  composition, or wiring icon/text/swap properties on a set.
- **`figma-arrange-component-set`** — canonical recipe for the arrange +
  label step: grid convention (size rows × variant/state cols, md first),
  EDGE_PAD focus-ring fix, re-run safety, name-based parsing, and how to
  adapt the script template for any new component — including single-column-axis
  sets (Field: State only, no sub-columns). No density rows — density
  is a frame concern. TRIGGER when writing or running an arrange script,
  laying out a component set grid, or adding labels to a component set.
- **`model-routing`** — Opus/Sonnet/Haiku decision tree.

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
  (`@primitiv/react`). Component inventory lives at
  `.claude/skills/new-react-component/_generated/component-inventory.md`.

## Useful commands

```sh
cargo test --workspace                            # all Rust tests
pnpm --filter @primitiv/react qa:units            # React tests + coverage
pnpm --filter @primitiv/react exec vitest run src/X    # scoped, during a cycle
pnpm run build:wasm                               # rebuild wasm pkg
pnpm run dev                                      # workbench dev server
```

Don't use raw `grep`/`find`/`rg` from Bash when the Grep and Glob
tools fit. Don't run `find` from `/`.
