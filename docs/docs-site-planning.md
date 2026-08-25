# Primitiv Docs Site — Planning Doc

> **Status:** Working draft (planning stage — no implementation started)
> **Date:** 2026-07-19
> **Scope:** The public-facing, professional docs website for Primitiv.
> The current dev-facing docs (workbench + kitchen-sink apps) are
> explicitly out of scope for replacement — they remain a POC/testing
> surface (see `workbench-examples` skill). This doc plans the new site.

---

## 0. Summary

The public docs site is not a landing-page-plus-sidebar problem. Primitiv
is consumed through several genuinely different lenses — headless-only,
headless + installed registry styles, Figma design system, the CLI/registry
mechanics, and Harmoni (the standalone Figma palette plugin) — and the
*same component* has a materially different API surface depending on the
lens (e.g. a component's props table is headless props alone in "headless"
mode, but headless props **plus** the style-layer's `contract.json`
additions in "styled" mode). The site's information architecture and its
generated-content pipeline both have to be designed around that fact from
the start, rather than retrofitted.

This doc captures what's been decided in planning discussion so far, and
what's explicitly still open. It supersedes nothing — `docs/consumption-design.md`
and RFCs 0004–0006 remain the source of truth for the *distribution*
model (npm vs. registry, the styling contract, the CLI). This doc is about
how that model gets **documented**, not the model itself.

---

## 1. Decisions made so far

### 1.1 Consumption-mode switch is global and persistent, not per-component

A site-wide control (top nav) sets a mode that colors every page:

- **Headless** — behavior/props/a11y only, no CSS surface, npm install.
- **Styled (registry)** — headless props **plus** the style-layer's
  contract props/CSS variables, `primitiv add <name>` install.
- **Figma** — the page swaps to spec/redline content instead of code.

Rationale: a reader who is headless-only is headless-only across the
whole site; forcing a per-page choice adds friction to the common case.

**Default = Styled (set 2026-08-21; was Headless).** See §1.26 — headless
is the more interesting product story but the sharper landing, because a
mode whose snippets deliberately carry no styling props reads as
"incomplete docs" before it reads as "the styling is yours".
State persists (localStorage + a shareable URL param) and per-component
override remains available as an escape hatch, but is not the primary
mechanism.

**Resolved (was open sub-question 2.1):** checked against
`consumption-design.md` §2's four consumer profiles. Headless mode *is*
the npm-package mode (`pnpm add @primitiv-ui/react`) — no separate fourth
mode needed. Styled mode covers the "headless + registry styles together"
profile. The remaining profile — a consumer who brings their own
component library (e.g. Radix) and wants *only* Primitiv's styling
contract, never touching `@primitiv-ui/react` — isn't a fourth global
mode either; it's served by a **mode-agnostic "Contract reference"
block on every component page** (see the `contract` block in §1.7), since that content has zero
overlap with the headless React API and shouldn't be hidden behind a mode
switch that implies "you must pick headless or styled first."

### 1.2 One site, audience-forked at the top level

Harmoni (the Figma plugin) and the CLI/registry/component docs live in a
single deployed site rather than siloed properties, because they share
one token pipeline story and the audiences overlap. But the top-level nav
forks early along the designer/engineer line ("Design in Figma" vs.
"Build with code") since those are genuinely different reading paths.

### 1.3 No onboarding quiz — a "Start Here" page instead

Most traffic is expected to arrive already knowing roughly what they want
(via search landing on a specific component, or a deliberate technical
evaluator). A short, opinionated "Start Here" page states the handful of
consumption paths in one paragraph each with a link, rather than building
and maintaining an interactive quiz for a technical audience that reads
fine.

### 1.4 Proposed top-level structure

```
Primitiv Docs
├── Start Here
├── Concepts                  (mode-agnostic: read once regardless of switch)
│   ├── What Primitiv is (the family: Primitiv, Harmoni, registry, CLI)
│   ├── Tokens & theming model
│   ├── Density & the Context system
│   ├── Composition patterns (Slot/asChild, controlled vs uncontrolled)
│   └── Accessibility commitments
├── Components                [MODE-SCOPED — the switch lives here]
├── Registry & CLI
├── Design in Figma
│   └── Harmoni
├── Recipes / Guides          (task-shaped, cuts across modes)
└── Changelog / Releases
```

**Resolved (was open question 6):** keep both, don't collapse one into
the other. Every component page gets a small mode-aware "Getting this
component" block (`npm install` in headless mode, `primitiv add <name>`
in styled mode) for the 80% case — a reader on a component page should
never have to leave it to find the install command. The standalone
"Registry & CLI" nav section stays as the deep-dive for concepts that
aren't about any single component: `primitiv.json`/`primitiv.lock` shape,
the non-`add` commands (`theme`, `tokens`, `list`), and the registry-vs-
npm rationale.

### 1.5 Props tables must be generated, not hand-maintained

This is treated as a hard architectural constraint, not a nice-to-have.
Rationale: three consumption modes × N components means hand-maintained
tables will drift immediately and silently. The docs site must be a
**consumer of structured data extracted from source**, the same shape of
problem as the token emitter (`primitiv-emit`) already solves for
DTCG → CSS/SCSS/Tailwind.

### 1.6 Resolved: `contract.json` needs no diffing against headless props

Checked against a real file, `registry/components/tabs/contract.json`.
Finding: the contract schema (`root`, `dataAttributes`, `modifiers`,
`subcomponents`, `customProperties`) is a **wholly separate, CSS-facing
namespace with zero overlap with headless React props** — there is
nothing to diff. Confirmed further by reading the generated wrapper
(`registry/components/tabs/tabs.tsx`, header comment: *"generated from
contract.json — do not edit by hand"*): it composes
`Omit<HeadlessProps, modifierNames> & modifierProps`, i.e. contract
`modifiers[].options` **override** same-named headless props and are
otherwise additive. So `styled.contractProps` in the schema below maps
1:1 onto `contract.json`'s `modifiers[]`, and `dataAttributes` are purely
informational (already emitted automatically, not a prop a consumer
sets).

**Also resolved: where this extraction lives, for the styled half.**
`crates/primitiv-emit` already contains a Rust parser for this exact
schema (`src/contract.rs`, `src/wrapper.rs` — it's what generates the
`.tsx`/`.recipe.ts` files in `registry/components/*/`). The docs-data
pipeline should **reuse that parser** (e.g. as a new emit target, or a
docs-data command surfaced through `primitiv-cli`) rather than writing a
second JSON parser for `contract.json` in JS/TS. This only covers the
`styled` half of the schema, though — `crates/primitiv-emit` is Rust and
has no visibility into `packages/react`'s TypeScript source, so headless
prop extraction (open question 1 in §2 below) is unaffected and still
needs its own tooling decision.

### 1.7 Draft prop-data schema (per component, composed from two sources)

Composition happens **at build time**, not runtime: a docs build step
walks real source/contract files and emits per-component JSON, which the
site then renders. Draft shape — updated per §1.6's finding that
`contractProps` maps directly onto `contract.json`'s `modifiers[]` rather
than a computed diff, and a new `contract` block covers the mode-agnostic
reference from §1.5:

```jsonc
{
  "id": "tabs",
  "displayName": "Tabs",
  "kind": "headless" | "registry" | "prose",
  "status": "stable" | "beta",           // from ROADMAP.md checkbox state

  "headless": {
    "package": "@primitiv-ui/react",
    "importPath": "@primitiv-ui/react/tabs",
    "subComponents": [
      {
        "name": "Tabs.Root",
        "description": "...",             // FROM: JSDoc summary
        "props": [
          {
            "name": "defaultValue",
            "type": "string",
            "required": false,
            "default": "undefined",
            "description": "...",         // FROM: per-prop JSDoc comment
            "controllable": "value"
          }
        ]
      }
    ]
  },

  "styled": {                             // omitted entirely if kind === "headless"
    "installCommand": "primitiv add tabs",
    "dependsOn": ["button"],              // FROM: registry.json dependsOn
    "contractProps": [ /* FROM: contract.json modifiers[] verbatim — overrides same-named headless props, else additive (confirmed via the generated tabs.tsx) */ ]
  },

  "contract": {                           // mode-agnostic — shown regardless of the global switch (§1.5/§1.6)
    "rootClass": "primitiv-tabs",          // FROM: contract.json .root.class
    "dataAttributes": [ /* FROM: contract.json .dataAttributes[] + each subcomponent's — informational, not a settable prop */ ],
    "customProperties": [ /* FROM: contract.json .customProperties[] */ ],
    "subcomponents": [ /* FROM: contract.json .subcomponents[] — element, class, own dataAttributes/modifiers */ ]
  },

  "figma": { "componentSetKey": "...", "fileUrl": "..." },

  "a11y": {
    "keyboardInteractions": [ /* hand-authored — not reliably extractable */ ],
    "ariaNotes": "..."
  },

  "examples": [
    { "id": "basic", "title": "Basic usage", "sourceFile": "examples/tabs/basic.tsx" }
  ]
}
```

Sourcing summary:
- `headless.*` — extracted from `packages/react` TSDoc/JSDoc. Tooling
  still open — see question 2.1 below.
- `styled.*` and `contract.*` — read directly off each registry
  component's `contract.json` (no diffing — see §1.6), ideally by reusing
  `crates/primitiv-emit`'s existing contract parser rather than a second
  JS-side one. `styled.dependsOn` also pulls from `registry.json`.
- `figma.*` — from stored Figma node/component-set references.
- `a11y.*` — hand-authored (schema-shaped for consistent rendering, but
  not auto-generatable).
- `examples[].sourceFile` — convention-based (see §1.9).

### 1.8 Headless prop extraction: `react-docgen-typescript`

Checked its dependency footprint before committing, given the concern
that a docs-tooling dependency shouldn't risk contaminating the styling
solution: `npm view react-docgen-typescript dependencies
peerDependencies` returns **zero runtime dependencies**, only a
`typescript` peer dependency (already present in the repo). No CSS or
styling packages anywhere in its tree, so it's safe on that front. Chosen
over a hand-rolled TS-compiler-API walk — it already handles the fiddly
cases (generics, distributive `Omit` types like `TabsProps` in
`tabs.tsx`, inherited props) that a custom walker would have to
reimplement.

### 1.9 Examples: separate docs-only example files, not embedded workbench/kitchen-sink

Public docs demos are authored as their own files, not embeds of the
existing workbench/kitchen-sink examples. Keeps the documented boundary
intact — workbench/kitchen-sink stays "not a production surface" (per
`workbench-examples` and the root `CLAUDE.md`) — and lets docs examples
be held to a public-facing bar independent of how workbench evolves.
`examples[].sourceFile` in the §1.7 schema points at these new files, not
at `apps/workbench` or `apps/kitchen-sink`. **Not yet decided:** the
exact location/convention for these files (e.g. a new
`docs/examples/<component>/` tree) — a detail for implementation, not
blocking further planning.

### 1.10 Docs site framework: Next.js

Chosen over Astro and Docusaurus. Rationale from discussion: the team
already knows Next/React deeply, and removing a second framework to
learn outweighs Astro's smaller default JS footprint for a mostly-reading
site. Next also leaves room for more interactive tooling later (e.g. an
in-browser playground) without a framework swap. Docusaurus's built-in
versioning was a point in its favour, but moot given §1.11 (no versioning
needed for v1).

### 1.11 Versioning: always latest for v1

Docs track `main`/latest; no version-pinning infrastructure for v1.
Matches the project's current fast-moving v0.1.0 stage and the repo's
general bias against premature infrastructure. Revisit once there's an
actual second major version to pin against.

### 1.12 Docs-data pipeline: Node/TS orchestrator, shells out to Rust

A Node/TS script (e.g. `scripts/generate-docs-data.mjs`) is the
orchestrator: it runs `react-docgen-typescript` in-process for the
headless half (§1.8), and shells out to a small new JSON-emitting
subcommand on `primitiv-cli`/`primitiv-emit` (e.g. `primitiv-emit
contract --json`) for the styled/contract half (§1.6), then merges both
into the per-component JSON described in §1.7. Rationale: keeps the
TS-heavy extraction where TS tooling lives naturally, and only requires
one small new Rust-side surface (a JSON-emitting subcommand) rather than
Rust spawning and trusting a Node subprocess's output shape.
**Not yet decided:** the exact new Rust subcommand's name/flags, and
where the merged JSON is committed (candidates from earlier discussion:
a new `docs/data/` tree, or alongside `registry/components/*/`) — both
are implementation details, not blocking.

### 1.13 Registry & CLI section vs. per-component inline install: keep both

See the resolution folded into §1.4 above — a mode-aware "Getting this
component" block per component page for the 80% case, plus the
standalone "Registry & CLI" section for concepts that span components
(`primitiv.json`/`primitiv.lock`, non-`add` commands, registry-vs-npm
rationale).

### 1.14 Resolved: props tables note the extended HTML element, don't enumerate inherited attributes

A component's props table shows only props it actually declares —
`asChild`, `type` on `ButtonProps`, for example — plus a single "extends
`HTMLButtonElement`" note, rather than listing every inherited native
DOM attribute (`onClick`, every `aria-*`, `style`, ...). Verified against a
real, working extraction (`react-docgen-typescript@2.4.0`, `typescript@6.0.3`
— the repo's actual TS version; note this doesn't yet work against
`typescript@7.x`, which changed the internal API `react-docgen-typescript`
relies on):

> **Version + API note (corrected 2026-07-21).** An earlier draft of this
> section cited `@14` — that version does not exist; the package's whole
> line is 2.x and the verified version is **`2.4.0`** (zero runtime deps,
> only a `typescript >= 4.3.x` peer). Also: on TS 6.0.3 the parser must be
> built with **`withCustomConfig(tsconfigPath, opts)`**, not
> `withCompilerOptions({...})` — the latter's string enum values (e.g.
> `jsx: "react-jsx"`) make `createProgram` throw. With that setup the
> **entire headless library was run through extraction (2026-07-21): 42
> files → 159 component symbols → 511 props, every prop with a non-empty
> description, zero parse errors** — so §1.16's `Omit`-narrowing rule and
> the `@extends`-placement rule are confirmed across every component, not
> just Button/Tabs.

- **Headless side.** A `propFilter` excluding any prop whose declaration
  resolves into `node_modules` (the standard Storybook technique) leaves
  only the genuinely custom props. The "extends" note itself comes from
  a **`@extends HTMLButtonElement` JSDoc tag**, which must live in the
  *component's own* doc comment (the one directly above `export function
  Button`), not on the `*Props` type — react-docgen-typescript only reads
  the component-level doc block when the component has one, which every
  component here does. **Sharp edge, confirmed by testing:** a JSDoc
  block tag consumes every line after it up to the *next* tag, so
  `@extends` must sit immediately before `@example` (or be the very last
  tag if there's no `@example`) — placing it right after the opening
  description silently swallows the rest of the comment into the tag's
  value. Landed as a working example on `Button.tsx` (§1.15).
- **Styled/registry side — no new authoring needed.** `contract.json`
  already has this: `root.element` (`"button"` for Button, `"div"` for
  `Tabs.Root`) and each `subcomponents[].element`. The pipeline maps
  `element: "button"` → `HTMLButtonElement` via a small static lookup
  table (HTML tag name → interface name) — free, from already-structured
  data.
- **Correction, found while testing against Tabs (§1.16): the naive
  `propFilter` is wrong.** A filter that excludes a prop when its
  *nearest* declaration (`prop.parent`) is in `node_modules` produces
  **false negatives**: `Tabs.Trigger`'s `value` and `disabled` — genuine,
  required, custom-documented props — were silently dropped, because
  `HTMLButtonElement` also happens to have attributes of those names, and
  react-docgen-typescript's `.parent` only reports one of the two
  declaration sites. The correct rule is to exclude a prop **only when
  every one of its declarations** is in `node_modules`
  (`prop.declarations.every(d => d.fileName.includes("node_modules"))`),
  not just the nearest one. Re-verified against both Button and Tabs with
  the corrected filter (§1.16).
- **New wrinkle from the correction: descriptions can end up
  concatenated.** With the corrected filter, `Button`'s `ref` and
  `children` *do* reappear (they also have a real declaration in
  `types.ts`, from being redeclared for type-narrowing/JSDoc) — but their
  `description` is React's own built-in doc text concatenated with ours,
  which reads as noise. **Not yet decided:** the extraction step should
  post-process this — when a prop has both an own-file and a
  `node_modules` declaration, keep only the own-file description — but
  this is pipeline logic, not something fixable from the source side.
  Logged as open question 4 below.

`headless.subComponents[].props` in the §1.7 schema needs one more field:
`extends: "HTMLButtonElement"` (or `null` for a component with no root
HTML element, if any exist). Full worked example, not just a draft: see
`packages/react/src/Button/Button.tsx`'s `@extends` tag and
`types.ts`'s per-prop JSDoc, added directly to prove this out.

### 1.15 Landed: Button's JSDoc expanded as the first concrete example

`packages/react/src/Button/{Button.tsx,types.ts}` now carry the full
per-prop JSDoc bar (matching `Tabs/types.ts`'s existing quality) plus the
`@extends HTMLButtonElement` tag, verified end-to-end against a real
`react-docgen-typescript` run (§1.14) — not just written speculatively.
`tsc --noEmit` and the Button vitest suite both pass unchanged (pure
documentation addition, no behaviour change, so no test/coverage impact
under the strict-TDD rule in the root `CLAUDE.md`). **Tabs is the
deliberate second data point** (§1.7's original reasoning) — its
per-prop JSDoc already exists, but it has never been run through
`react-docgen-typescript`, and it's a richer case: sub-components,
controlled/uncontrolled unions, and multiple root elements (`Tabs.Root`
is a `div`, `Tabs.Trigger` is a `button`) to prove the per-sub-component
`extends` mapping, not just a single-element one.

### 1.16 Landed: Tabs polished as the second data point, plus a real source-pattern bug found and fixed

`packages/react/src/Tabs/{Tabs.tsx,types.ts}` now carries `@extends` tags
on all four sub-components (`TabsRoot`/`TabsList`/`TabsTrigger`/
`TabsContent` → `HTMLDivElement`/`HTMLDivElement`/`HTMLButtonElement`/
`HTMLDivElement`) and fills the per-prop JSDoc gaps that existed
(`orientation`, `dir`, `activationMode` on Root; the `label`/
`ariaLabelledBy` union on List; `disabled`/`value` on Trigger) —
Tabs was already close to the bar Button was raised to, this closes the
remaining gaps. `tsc --noEmit` and the full Tabs vitest suite (134 tests)
pass unchanged.

**A genuine source-code bug found and fixed while verifying extraction,
not just a docs artifact.** `TabsRootProps` narrowed `dir` from the
native `ComponentProps<"div">`'s `dir?: string` to the component's own
`TabsReadingDirection` (`"ltr" | "rtl"`) **without first `Omit`-ting
`"dir"`** from the base type — unlike `onChange` and `ref` in that exact
same type declaration, which *do* follow the correct pattern. TypeScript
itself resolves the intersection correctly at the type-check level (no
compile error, `"ltr" | "rtl"` is what a consumer actually sees), but
`react-docgen-typescript`'s static analysis isn't doing that same
narrowing math — it picked only the wider `node_modules` declaration,
silently losing both the narrowed type and all JSDoc for `dir` in the
extracted output. Fixed by adding `"dir"` to the existing `Omit` list,
matching the established convention already used for `onChange`/`ref` in
the same file. **General rule for future component authoring, worth
carrying into a lint rule or the `new-react-component`/
`react-component-patterns` skills later:** any custom prop that narrows
or redefines a same-named native HTML attribute must `Omit` it from the
base `ComponentProps<T>` first, or the docs-data pipeline will silently
drop it.

### 1.17 Component gaps for the docs site — re-audited, only the search / command palette remains

**Original audit.** Cross-checked the then-41-component headless
inventory
(`.claude/skills/new-react-component/_generated/component-inventory.md`)
and the then-17-component registry (`registry/registry.json`) against
what a docs UI structurally needs. Most of it was already covered —
`Tree` (nav sidebar), `Breadcrumb`, `Table` (props tables), `Accordion`/
`Collapsible` (collapsible nav/FAQ sections), `code-block`/`inline-code`
(already registry components, built for this), `prose` (already the
flow-rhythm foundation RFC 0016 built, i.e. the reading-experience base),
`SkipNav`, and `ToggleGroup` (a plausible fit for the mode-switch control
itself — already has a registry surface, so no new component needed
there). Three things were missing entirely: **Callout / admonition**,
**Badge / status pill**, and **Search / command palette**. `Tree` and
`Breadcrumb` also existed headless but had no registry/styled surface,
which fed open question 2 below.

**Re-audit, 2026-08-13.** Walked the v2 landing wireframe (Figma page
"Wireframes — Docs Site (v1 — landing)" — desktop, mobile, mobile
menu-open, mobile framework-dropdown-open, plus its `Wireframe notes`
frame) region by region against the current library: **46 headless
primitives and 62 registry components**, up from 41 and 17. Two of the
three original gaps have closed and both registry-surface caveats are
gone:

- **Callout / admonition → closed.** `alert` shipped as a registry
  component (`info`|`success`|`warning`|`danger` × xs–xl, optional
  dismiss composing Icon Button). A docs admonition wants a title, rich
  body and no dismiss — all of which Alert already supports.
- **Badge / status pill → closed.** `badge` landed 2026-07-29 with
  RFC 0021, alongside `tag` and `chip`.
- **`Tree` + `Breadcrumb` registry surfaces → landed** (plus
  `breadcrumb-overflow`). **This effectively settles open question 2 in
  favour of dogfooding**: there is no longer a "build the registry
  surface first" cost blocking the nav/breadcrumb pieces.
- **Search / command palette → the component gap closed; the composite is
  designed but not built.** `Combobox` landed 2026-08-14 (all four stages),
  which supplies every piece of wiring item 1 below said was missing, and
  the palette's own design was settled 2026-08-21 on the Figma
  "Command Palette — exploration" page. See §1.25.

The whole landing page is therefore buildable today except the palette.
Region-by-region (bracketed numbers are the `Wireframe notes` callouts):

| Wireframe region | Built from |
|---|---|
| Nav bar (transparent over hero) | `container` + CSS; sticky/transparent is pure CSS, no component |
| Audience fork — "Design in Figma / Build with code" [2] | `navigation-menu` (its underline `Indicator` modifier already exists) or `tabs` |
| Framework selector — React/Vue/Svelte [10] | `segmented-control` on desktop · `select` rich mode on mobile |
| Mode switch — Headless/Styled/Figma [1] | `segmented-control` (the original audit nominated `ToggleGroup`; both have registry surfaces) |
| Search field [3] | **Superseded 2026-08-21 (§1.25):** not a field at all — a field-shaped `<button>` (Input's geometry) carrying a `kbd` "⌘K" hint in Input's trailing `INSTANCE_SWAP` slot. The real input lives inside the palette |
| Theme toggle (nav circle button; Light/Dark row in the mobile menu) | `segmented-control` / `toggle-group` |
| Hero lockup [9] | Existing asset — `logo-concepts/primitiv-lockup-stacked.svg` (also copied into `apps/docs/public/`) |
| Hero dot-grid texture [9] | CSS `radial-gradient`, no component |
| Headline / sub-paragraph / scroll cue | `prose` flow rhythm + plain markup |
| Two hero CTAs | `button` (primary + secondary) |
| Three consumption-path cards [4] | `card` + `inline-code` for the single-line install chips + the `arrow-right` icon |
| Documentation map [5] | `grid` + `list` (a nested list is just a `List` inside a `List.Item`) + `tag`/`badge` for the "mode-scoped" pill [6] |
| Tabbed install block [7] | **Already built** — `CodeBlock.Tabs`/`.List`/`.Trigger`/`.Content` composes the headless `Tabs` primitive for npm/pnpm/yarn/bun and carries the Copy control, i.e. §1.18's tabbed-install decision is implemented |
| Status badge "Stable" [8] | `badge` — `success`\|`warning`\|`info`\|`danger` × `label`\|`counter` × xs–xl |
| Props table | `table` or `data-table`; `scripts/docs-data/extract-docs-data.mjs` already emits the data (§1.19) |
| Footer | `grid` + `list` + `divider` |
| Mobile hamburger menu | `drawer` + `collapsible` + `navigation-menu` — this exact composition is already demoed in the kitchen-sink |
| Mobile Audience / Mode / Framework rows | `select` rich mode — `SelectItemIndicator` (the ✓), `SelectItemLeading` (framework logo), `SelectItemTrailing` (the "Soon" pill), and headless `Select.Item disabled` for greyed Vue/Svelte |
| "Soon" pills | `tag` (it carries the neutral tone `badge` deliberately lacks) |

**What is still needed:**

1. ~~**Search / command palette.** Nothing named combobox, command or
   palette exists in `packages/react` or the registry... What is missing is
   the combobox wiring itself: filtering, `aria-expanded`/`aria-controls`
   on the input, forwarding arrow/Enter/Escape from the input into the
   list, grouped results, and an empty state.~~
   **Answered 2026-08-14/21.** Every item in that list is now shipped, by
   `Combobox`. The palette is therefore a pure composition, designed and
   settled on its own exploration page but **not yet built** — see §1.25
   for the nine settled calls, the two changes that land in *other*
   components, and the build order. The search *index* remains a site
   concern, not a component one.
2. **Framework brand logos.** `@primitiv-ui/icons` is 45 glyphs in the
   house line style and holds no third-party brand marks, so the
   React/Vue/Svelte logos the framework selector needs [10] must be
   added as their own SVG assets — and deliberately **not** redrawn in
   the house line style, since they are trademarks with their own
   published usage rules.
3. **A judgement call, not a gap:** `badge` has no neutral tone, so a
   greyed "Deprecated" status pill would want `tag` instead, splitting
   status pills across two components. Worth settling before the
   component page is built.

### 1.18 Wireframe-surfaced UI decisions: framework selector + package-manager-tabbed installs

Two site-chrome controls settled while wireframing the landing page
(`scripts/figma/create-v2-docs-landing-wireframe.js`):

- **Framework selector.** The library targets React only for v1 (the
  headless package is `@primitiv-ui/react`, the sole framework surface).
  Rather than leaving that implicit, the site carries a small **framework
  radio group mirroring the mode switch — React active (with its logo);
  Vue / Svelte shown greyed as "future"** — so an evaluator sees both the
  current scope and the intended direction at a glance. It's a global
  control (desktop nav, beside the mode switch; folded into the mobile
  menu as its own `FRAMEWORK` section), not per-page. It is orthogonal to
  the §1.1 consumption-mode switch: mode = *what you consume*
  (headless / styled / Figma), framework = *which code flavour* — for v1
  the latter has exactly one enabled option.
- **Install code blocks are package-manager-tabbed.** Every install code
  block (the per-component "Installing a component" block, §1.13) carries
  **npm / pnpm / yarn / bun** tabs so the reader copies the command for
  their own manager; npm is the default/active tab. ~~(The at-a-glance
  install *chips* on the three consumption-path cards stay single-line —
  the tabbed block is the interactive one.)~~
  **Superseded 2026-08-13** — the consumption-path cards now carry full
  tabbed blocks too, decided while reviewing the landing page built from
  the system (see §1.23). The Headless card tabs **npm / pnpm / yarn /
  bun**; the Styled card tabs the CLI *runners* — **npx / pnpm dlx /
  yarn dlx / bunx** — because `primitiv add` is executed, not installed.
  The Figma card gets **no code block at all**: there is no command to
  copy, so it takes a secondary Button ("Open the Figma library") instead.
  Forcing a code block there would have been a block with nothing to say.

Both are wireframe-level IA/site-chrome decisions, not distribution-model
changes — `docs/consumption-design.md` and the RFCs are unaffected.

### 1.19 Landed: docs-data extractor POC + a generated-data component-page wireframe

The docs-data pipeline (§1.12) now has a **working proof of concept**, and the
Component page is wireframed **laid out from its output** rather than
hand-typed values:

- **`scripts/docs-data/extract-docs-data.mjs`** — emits per-component JSON in
  the §1.7 schema. The headless half walks the `*Props` type with the
  **TypeScript compiler API** (resolved from `packages/react`, pinning the
  repo's TS 6.x) and applies the §1.14/§1.16 `propFilter` — a prop is dropped
  only when *every* declaration is in `node_modules`, so native DOM attributes
  fall away but a redeclared `children`/`ref`/narrowed `type` is kept — plus
  the `@extends` tag and per-prop `@default`/description. The styled half is
  read straight off `contract.json` (§1.6, no diff): `modifiers[]` →
  `contractProps`, plus `customProperties`/`dataAttributes`. **Note:** this
  used the TS compiler API directly rather than `react-docgen-typescript`
  (§1.8) — neither RDT nor a root TS was installed, and the compiler API needs
  zero new deps while applying the identical filter rule. The chosen tool for
  the *real* pipeline is still RDT per §1.8; the compiler-API POC is
  swap-compatible (same schema out). The styled half should still move to the
  Rust `contract.rs` parser via a JSON subcommand (§1.12) rather than the
  POC's inline JS `contract.json` read.
- **Result for Button** (`scripts/docs-data/button.docs.json`): 4 headless
  props (`asChild`, `children`, `ref`, `type`) + `extends HTMLButtonElement`,
  2 contract props (`variant`, `size`), 14 `--primitiv-button-*` CSS vars.
- **`scripts/figma/create-v1-docs-component-page-wireframe.js`** — the Figma
  page "Wireframes — Docs Site (v1 — component page)" (desktop + mobile +
  notes). The props table (types, defaults, descriptions), the `extends` note,
  and the CSS-variable list are all rendered from that generated data; the
  Styled-mode `variant`/`size` rows are appended and tinted to show the §1.1
  content swap. It also establishes the reusable **docs app shell** (persistent
  top nav + left §1.4 sidebar with the active component + main content +
  on-this-page TOC) that every non-landing page reuses, and connects from the
  landing via `Browse Components` → Components → Button (breadcrumb closes the
  loop). Because the Figma console can't read repo files, the script embeds a
  snapshot of the JSON (`D`); a real Next.js build imports the JSON directly.

**Component-page layout decision — demo-first Playground, shown in Styled
mode.** The page leads with a Radix-style **Playground** (preview + Variant /
Size / **Density** controls) above the docs, per feedback. That control set is
a better fit for Primitiv than for a generic library: **density is the Context
system** (a `<Density>` ancestor / `data-density`, not a Button prop) and size
is the contract scale — the playground demos two system concepts live. Because
those controls are all styled-surface concerns (a headless Button has no CSS,
and `variant`/`size` aren't in its API), the playground is a **Styled-mode
feature**; the wireframe therefore shows the page with the mode switch on
**Styled** (install `primitiv add button`, contract props inline and tagged),
and notes that Headless mode degrades the playground to a plain preview and
drops `variant`/`size`. This makes the playground the concrete payoff of the
§1.1 mode switch.

Still POC-grade: single component (Button), no orchestrator merging both
halves into the committed `docs/data/` tree yet, and the a11y/examples content
is hand-authored placeholder (§1.7 says a11y isn't auto-generatable).

### 1.20 Compound-component stress test (Tabs) — findings

The Button POC (§1.19) was repeated on a **compound** component to see what it
exposes design/layout-wise. The extractor was extended to multiple
sub-components (`scripts/docs-data/tabs.docs.json`: 4 sub-components, 15
headless props, 2 contract props, 22 CSS vars) and the page wireframed from it
(`scripts/figma/create-v1-docs-component-page-tabs-wireframe.js`, desktop +
mobile + a Findings panel). What Tabs surfaced that Button didn't:

1. **Multiple prop tables.** One table per sub-component
   (`Root`/`List`/`Trigger`/`Content`), each with its own `extends`. The single
   "Props" section fans out and the page grows to ~3000px desktop / ~3400px
   mobile — enough that **collapsible sub-sections and a nested TOC** (Props →
   the four parts, added) become worthwhile. Mobile especially: a compound
   component is a very long scroll.
2. **Controlled/uncontrolled isn't extractable.** The discriminated union on
   `Tabs.Root` (`value`+`onValueChange` XOR `defaultValue`) flattens to a plain
   prop list — the mutual-exclusivity is lost. It needs a **hand-authored
   callout** (added, amber-tagged) or a **schema "prop group" concept**; §1.7's
   flat `props[]` has no way to model it. General for any stateful component.
3. **A real source bug — two more §1.16 instances.** `TabsRootProps.defaultValue`
   and `TabsTriggerProps.value` narrow a native attribute **without `Omit`-ting
   it first**, so extraction saw `string | (readonly string[] & string)`. The
   extractor now normalises the artifact, but the **source should add the
   `Omit`** — a third + fourth instance of the §1.16 pattern, strengthening the
   case for a lint rule. **(Fixed + swept the whole package — see §1.21.)**
4. **Aliased / complex types need resolving.** String-literal-union aliases
   (`TabsOrientation` → `"horizontal" | "vertical"`) must be **expanded** — the
   extractor now does this. But non-literal aliases still leak their name
   (`TabMetadata` in `onChange`, `Ref<T>`) → the pipeline needs a **linked
   types glossary / hover** for those.
5. **Generics leak a type param.** `Tabs.Trigger<T>` renders `ref: Ref<T>`.
   Generic sub-components need a display rule (show the default element).
6. **Interactive ⇒ richer a11y + data-attributes.** A **keyboard-interactions
   table** (not Button's bullets) and **per-sub-component data-attributes**
   (`data-state`/`data-orientation`/`data-disabled`) appear. Both are
   hand-authored (§1.7) — confirming the a11y authoring burden scales with
   component complexity, and that `a11y.keyboardInteractions[]` in the §1.7
   schema is the right shape.
7. **New sections for compound.** An **Anatomy** (composition) section is
   essential and Button never needed it. The **Playground** control set is now
   heterogeneous — a headless enum prop (`orientation`), contract props
   (`size`/`justify`) and the Context system (`density`) — so controls must be
   **sourced from three places and labelled by origin**.

Net: the template held up, but items 1–2 (nested/collapsible prop tables +
a prop-group model) are the concrete docs-site follow-ups; item 3 was a real
source bug now fixed package-wide (§1.21); 4–5 refine the extractor's type
handling.

### 1.21 Landed: swept + fixed the §1.16 narrow-without-Omit bug across the headless package

Finding §1.20.3 turned out **not** to be Tabs-only. A scan
(`scripts/docs-data/scan-prop-collisions.mjs`) over every exported `*Props`
type under `packages/react/src` — flagging any prop whose declarations span
**both** own-source and `node_modules` (i.e. a native attribute re-declared
without `Omit`) and classifying NARROW (types differ → real artifact) vs
benign same-type redefinition — found **19 narrowing artifacts across 10
components**:

- **`defaultValue`** narrowed without `Omit` on the value-bearing collection
  roots: **Accordion, RadioGroup, RadioCard, SegmentedControl, ToggleGroup,
  MillerColumns, Dropdown (RadioGroup), Tabs** — each resolved to
  `string | (readonly string[] & string)` (or `string[]` variants).
- **`value`** narrowed on **`TabsTriggerProps`**.
- **`ref`** narrowed to a menu element on **ContextMenu** and **Dropdown**
  `Content`/`SubContent` — an intersection of two ref types
  (`Ref<HTMLElement> & Ref<HTMLMenuElement>`), the genuinely consumer-facing
  case (D58: a styled wrapper spreading these props back could fail to
  type-check).

**Fix:** add the native attribute to each base `Omit<ComponentProps<...>, ...>`
(the same fix §1.16 applied to `dir`, and that `Tabs.Root` already used for
`ref`). Type-only; no runtime change. The 215 benign `ref`/`children`
same-type re-declarations were left alone.

**Verified:** scan clean (0 NARROW); `tsc --noEmit` green; full React suite
**2108 tests pass, coverage 100%** (statements/branches/functions/lines — no
regression); `qa:registry-types` passes (the styled surfaces the kitchen-sink
consumes type-check against the fixed headless types). Mutation coverage is
unaffected by construction — no runtime code changed.

**Guard against recurrence:** the scan now exits non-zero on any NARROW and is
wired as `pnpm qa:prop-collisions`. Worth adding to CI and folding the
Omit-narrowing rule into the `react-component-patterns` / `new-react-component`
skills (the §1.16 to-do, now with teeth).

### 1.22 New product goal: the docs site must be built for AI agents, not just human readers

Raised in planning discussion (2026-08-09), prompted by the "Copy page" /
"Copy MCP Server URL" / "Add MCP Server" pattern now common on docs
platforms (e.g. Mintlify-powered sites). **Committed as a product goal for
the docs site** — not yet scoped for implementation; the concrete build
decisions are deferred to when the docs site build phase starts (see the
new open question below and §3).

Two distinct outcomes are wanted, and they call for different mechanisms:

1. **An AI agent evaluating UI-layer options should be able to discover
   and suggest Primitiv**, not just look it up once told to. This needs
   something an agent can query *proactively* — a live, structured
   interface, not a page it has to already know to fetch.
2. **An AI agent that's already chosen Primitiv should be able to load the
   library's full API quickly and completely.** This is closer to a
   solved problem: serve the docs as clean, complete, LLM-friendly text.

Two mechanisms map onto these, both additive to the already-planned
Next.js docs site (§1.10) rather than a separate property:

- **`llms.txt` / `llms-full.txt` + a markdown mirror of every docs page**
  (a `.md` route alongside each page's HTML, per the "Copy Markdown page /
  View as Markdown" pattern). Framework-level, cheap, and serves goal 2 for
  *any* agent regardless of what tooling it has — no MCP client required.
- **A thin MCP server wrapping the registry** — `list_components`,
  `get_component_contract`, `get_install_command`, `search`, sourced
  directly from `registry.json` + each component's `contract.json` (the
  same structured data §1.5–§1.7's docs-data pipeline already consumes, so
  this is a second consumer of that data, not a second source of truth).
  This is what actually serves goal 1: an agent with the server available
  can enumerate and reason over the whole library while a user is still
  deciding on a UI layer. `"Add MCP Server"`-style one-click install
  deep-links (registering the server straight into the requesting agent's
  config) are the connection mechanism seen on comparable sites.

Primitiv's registry model (`registry.json` + per-component `contract.json`
+ the `primitiv` CLI) is structurally close to what shadcn/ui already
does, which is a real head start for both mechanisms — "what components
exist" and "what's this component's API" are already structured data, not
prose that would need separate authoring for agent consumption.

**Not yet decided (deferred to the docs-site build phase):** hosting for
the MCP server, its exact tool surface, how its data freshness relates to
the embedded-registry-rebuild gotcha (root `CLAUDE.md` — a CLI binary must
be rebuilt for registry changes to surface; an MCP server reading the same
source would need the same discipline or read live from source instead of
a baked-in copy), and where `llms.txt` generation plugs into the Next.js
build. See the corresponding open question below.

### 1.23 Landed: the landing page rebuilt from the design system, and what that exposed

The v2 landing wireframe was rebuilt in Figma **using only components,
variables and text styles that exist in the file** — a deliberate capability
test of whether Primitiv can build its own docs. Two frames sit side by side
on the "Wireframes — Docs Site (v1 — landing)" page for comparison.

| | first build | rebuilt on the primitives |
| --- | --- | --- |
| Component instances | 35 | **72** |
| Anonymous scaffold frames | **37** | **0** |
| Text nodes / using a text style | 21 / 21 | 21 / 21 |

**The finding that mattered: Figma had no layout primitives at all.** The
registry has shipped `box`, `stack`, `grid`, `center`, `spacer` and
`aspect-ratio` since RFC 0022, but the design file only had `Container` — so
roughly half of any page was anonymous auto-layout frames that no code
component corresponded to, which is exactly the drift the two-surface model
exists to prevent. All six are now built (page "Layout Primitives"), and the
rebuild has **zero** anonymous frames: every band is a `Box`, every row and
column a `Stack`, the card row a `Grid`, the nav split by a `Spacer`.

Gaps this test found and closed, all Figma-side:

- **`Card` had no content slot** — a card could hold a title and one
  paragraph and nothing else, so the install affordance had to sit outside
  the card's border. Card now has one.
- **`ListItem` had no text property, then no way to hold a Link** — labels
  were unexposed inner nodes. It now has `Label`, plus `Show link` and a
  nested slot so a row can contain a real `Link` while keeping
  `<ul><li><a>` semantics.
- **58 of 314 slot nodes were broken** — `Tabs` and `Accordion` content
  slots were `layoutMode: NONE`, which positions appended children at 0,0
  so content stacked invisibly; `Container`'s slot was a fixed 240px. All
  repaired, and the per-size slot-property fragmentation on `Tabs / Panel`
  and `Accordion/Panel` fixed too (content now survives a Size switch).
- **`Button` and `Input` defaulted both icon booleans to `true`**, so every
  new instance arrived wearing two chevrons.

Two things the design file still cannot express faithfully, both recorded in
the component descriptions: **`Grid` is a wrap-based approximation** because
Figma rejects CSS-grid layout on slot frames, so there is no `columns` axis
and no per-breakpoint column map; and **`Aspect Ratio` is fixed-pixel**
rather than fluid.

**Still open:** more creative section backgrounds. The Next.js site is not
limited to flat bands, so the design should explore gradients, textures and
inverted sections — the constraint is only that the *elements* stay on
existing tokens, variables and components.

### 1.24 Resolved: props tables are tabbed **by part**, and the styled-vs-headless tint is replaced by a `From` column

Building the Button and Select component pages from the design system
settled how §1.7's prop data is presented. Two changes to what the
wireframes assumed:

**The tinted "contract row" is gone.** The Button page originally marked
styled-contract props with a tinted table row plus a legend — *"Tinted
rows are added by the styling contract — absent in Headless mode."* That
asks the reader to decode a colour, and it encodes meaning in colour
alone, which fails WCAG 1.4.1. Replaced by an explicit **`From`** column
reading `headless` or `contract`. Columns are now Prop · Type · Default ·
From · Description.

**Props are tabbed by part, not by mode.** Tabs were first proposed for
Headless | Styled — legitimate under §1.1, which keeps the global switch
primary "but per-component override remains available as an escape
hatch." Rejected on weight: for a 9-part compound like Select the mode
axis has 2 values and the styled side adds only three modifiers (`size`,
`mode`, `placement`) that already appear in the mode-agnostic contract
block (§1.5–§1.6), whereas the *part* axis has 9 values and Root alone
carries 14 props — nine stacked tables otherwise. Part tabs also avoid a
desync question the mode tabs create: if the global switch says Headless
and a props tab says Styled, the Installation block is still following
the global switch.

Rich-vs-native needed no column of its own: the part answers it for five
of the nine (Trigger, Value, Content, ItemIndicator and Separator are
rich-only; Placeholder is native-only), and for Root's three exceptions
the source JSDoc already opens *"Rich mode only —"*, so the generated
description carries it.

**Superseded in the same session: `Accordion`, not tabs.** Tabs hide
content, so find-in-page, deep-linking and printing all suffer — which is
why Radix stacks every part visibly. The deciding detail was structural:
`Accordion/Item` carries its own hairline (`border/subtle`, bottom 1px)
and its description says *"No container, no per-item box"*, so stacking
nine is **lossless**. `Tabs` puts its rule on the composed set's
`primitiv-tabs__list` frame, so a hand-built strip has no baseline at all
and had to fake one with a bound stroke. Both composed sets cap at
`Count=5` and neither can hold nine parts as a drop-in, but Accordion's
parts (`Accordion/Item` + `Accordion/Panel` + `Accordion / Panel Slot`)
compose cleanly where Tabs' do not.

Settled: **desktop shows all nine expanded** — Radix's model plus a
collapse affordance, and everything stays searchable. **Mobile shows the
first expanded only**, which also sidesteps a 9-tab strip wrapping to
three rows at 390px.

**Consequence for §1.1 — the props table is mode-agnostic.** With a
`From` column the table lists headless *and* contract props at once, so
it no longer responds to the global mode switch. That is deliberate and
follows §1.1's existing precedent for the mode-agnostic contract block: a
Headless reader benefits from seeing exactly which props they do *not*
get, which is more useful than hiding them, and it keeps the `From`
column informative in every mode. Filtering the rows instead would make
the column redundant in Headless mode (every row would read `headless`),
and dimming them would put the meaning back into colour alone.

### 1.25 Settled: the Command Palette design (§1.17's last gap), Figma-first

The palette was the one region of the landing wireframe that could not be
built from existing components (§1.17 item 1). `Combobox` closing that gap
did **not** make the palette a swap — per RFC 0021 §6 and `CLAUDE.md`
working-style §8 it got a full exploration page first, **"Command Palette
— exploration"** in the Figma file (11 sections, 130 real component
instances, immediately after "Combobox — exploration"). All nine calls
settled 2026-08-21.

**Framing:** a **library composite** — a `command-palette` registry
component, RFC 0021 Tier 3, which the docs site then consumes like any
other. RFC 0021's own composition line for it ("`Modal` (or `Popover`) +
`InputGroup` + the new Listbox") **predates Combobox and is superseded**.

| § | Settled | Why it wasn't the obvious answer |
|---|---|---|
| A | Top-aligned dialog over a scrim | Not convention — results change on *every keystroke*, and a centred dialog (today's Modal) slides its top edge, and the input with it, under a stationary cursor |
| B | The trigger is a field-shaped **`<button>`** + `⌘K` hint | Free in Figma: a `Kbd` swapped into Input's trailing `INSTANCE_SWAP` slot keeps its natural 34×22 rather than being squashed to the 16px icon square. In code it must be a real button with an accessible name, never an `<input readonly>` |
| C | Combobox's **parts**; the dialog *is* the panel | Combobox §A1 settled a *floating* `Dropdown / Panel`, which does not transfer: a panel inside a dialog means doubled border + elevation, and a `popover="auto"` element over a `<dialog>` — two top-layer elements whose order nothing guarantees |
| D | `Listbox / Option` unchanged + a `Tag` in its trailing slot | A two-line label+path row is the one option that costs tokens (a new `command-palette/{size}/item/*` family). Measured while building: the row reserves an 18px indicator gutter even at `Selected=false` — kept deliberately, since suppressing it means a Boolean on a master three components share |
| E | Group labels **always** | Listbox §E requires groups be named; labelling only when >1 group makes the list change shape as you type |
| F | Consumer-supplied defaults on empty query · `Listbox / Empty` on no match | `EmptyState` was genuinely tempting here (unlike in Combobox) and still loses: its furniture competes with the field, its height moves as the message wraps, and it says "dead end" when the user is one backspace from results. The component owns **no** history — "recents" is the site persisting a list and passing it in |
| G | No header; a thin keyboard-legend footer | `Modal/Footer` is the wrong part (button-row geometry, right-aligned), so the footer is the **one** piece of anatomy this composite invents |
| H | Modal's `Size` axis, defaulting to **`lg`**; fixed-height scrolling list | Modal already ships sm 360 / md 520 / lg 640 / xl 800, and a palette wants ~640 — so no bespoke width constant. Note it defaults *up* the ramp, the opposite of ConfirmDialog |
| I | Search everything; state the mode per row | Scoping to the §1.1 mode switch is the wrong instinct — mode is a rendering preference, not a permission, and a Headless reader searching "button" often wants the Styled page they haven't opened. Site-level call, no contract impact |

**Headline: no new design tokens** — structural rather than lucky (the
dialog is Modal's, the rows are `Listbox / Option`'s, the list padding is
`dropdown/{size}/panel/*`), and it holds **only** while A1 + C1 + D3 hold.

**Two of the four new things land in other components on purpose:**

1. **`Combobox.Content` needs a non-floating escape hatch** (`static` /
   `popover={false}`). The only headless change, and it belongs to
   Combobox — whose current `popover="auto"` + `showPopover()` is right for
   the standalone component (`docs/combobox-future-work.md` §0.1 records
   the three attempts it took) and wrong inside a dialog.
2. **`Modal` gains `Placement=center|top`** — a Figma axis plus a registry
   modifier. ConfirmDialog and every later dialog benefit; the alternative
   is a composite quietly forking dialog geometry.
3. The `⌘K`/`Ctrl+K` binding (platform split + a guard so it doesn't fire
   inside someone else's input), owned by the root with a `shortcut={false}`
   opt-out.
4. `CommandPalette.Footer`.

**Build order:** the Figma component set — **`lg`-first, not md-first**,
because §H makes `lg` the default and Figma takes its default variant from
the first one created → the two upstream changes, each its own cycle → the
registry `command-palette` (`dependsOn`: `modal`, `combobox`, `kbd`,
`tag`) → kitchen-sink demo → docs-site adoption.

**Already applied:** the v2 desktop landing frames (light + dark) now carry
the §B trigger instead of a live `Input`, and wireframe note [3] records the
settled design.

**Not yet applied — the live site.** `apps/docs-site/src/site/SiteHeader.tsx`
ships a real `<Input size="xs" type="search">`. It should become the §B
trigger, but **only when the palette exists to open** — a button that opens
nothing is worse than a field that filters nothing, and the swap also drops
the native `type="search"` clear affordance, so it wants doing once, with
the palette.

So the switch's remit is narrower than the wireframe note claimed
("Mode switch changes page CONTENT"). It drives: the **Installation**
command (`npm i` vs `primitiv add`), which **Playground** controls exist
(`variant`/`size`/`mode`/`placement` disappear under Headless), and
whether the **Styling contract** section appears. It does not filter the
props table.

---

### 1.26 Settled: contract props are mode-aware, and the playground shows both modes tabbed

Three related bugs, all found by reading the rendered Button and Select
pages rather than the code (2026-08-21).

**1. Snippets printed props that do not exist in the reader's mode.**
`variant`, `size` and `placement` are the *styled* layer's contract props —
docs-data already classifies them that way, and §1.24's `From` column
prints it in the table — but every code block wrote them unconditionally,
so Headless mode showed `<Button variant="primary">`, naming a prop the
primitive does not have. The same class of bug `partNamer` fixes for part
names, and worse: a wrong part name fails at import, a wrong prop fails
silently. Fixed with `contractAttr` in `lib/playground.ts`, which returns
the attribute in styled/Figma mode and either drops it or swaps it for a
`className` in headless. Which of the two depends on whether the prop *is*
the example's subject: dropping `variant` from the Variants example leaves
five identical `<Button>` lines beside a preview of five different
buttons, so there it becomes an illustrative class name; in the Disabled
example, where `variant="secondary"` is incidental, it simply goes.

**2. The Anatomy tree ignored the switch.** Its parts read
`Select.Trigger` in both modes; `anatomy[].code` is now `(mode) => string`
like every other snippet, and the trailing per-line `// <button
aria-haspopup>` annotations went with the change — they pushed every line
past the content width, so the block scrolled and the tree became the
harder half to read. What each part emits belongs in prose and in the
Data attributes table.

**3. Every snippet on the page now tabs BOTH modes, two-way bound to the nav.**
Superseding §1.24's "the switch drives which Playground controls exist":
the controls always exist, and the *snippet* is a two-tab code block —
**Styled first, Headless second** — whose tablist is a second view of the
global mode. Clicking a tab sets the mode; changing the nav switch moves
the tab. `useMode` is a shared `useLocalStorage` store, so these are two
views of one value, not two states to reconcile.

Why show both rather than follow the switch: "one design system, three
ways to build" is the product claim, and this is the one place on a
component page where the difference is legible at a glance — same
component, same controls, with the props moving to class names and the
import changing shape. Following the switch hides exactly that
comparison. It also closed a hole opened by fix 1: a single
mode-following snippet left a headless reader with controls that changed
the preview and nothing in the code, which reads as broken.

**Figma mode has no tab of its own** and rests on Styled — JSX is not the
artifact a designer wants (the call `partNamer` already makes), and the
copied file is the closest thing a Figma-driven handoff produces. Nothing
is written back on load, so a Figma reader stays in Figma mode until they
click a tab.

**One block, used everywhere** (`site/ModeCodeBlock.tsx`): the playground
snippet and every example snippet, so a reader meets one rule per page
rather than a mixture. Extracted rather than duplicated specifically so
the two-way binding cannot drift between them. `code` is called once per
*tab* rather than once per render, which is why it takes the mode as an
argument instead of reading the store itself.

**Two blocks deliberately keep their own tab axis, and this is unresolved
UI rather than a settled call.** `InstallTabs` tabs the package managers
(npm / pnpm / yarn / bun) and `Anatomy` tabs the render path (Rich /
Native on Select) — one tablist cannot carry two axes, so neither took
the mode tabs. Anatomy *does* follow the nav switch silently, so it is
correct, just not tabbed; Installation already swaps its command with the
mode. The open question is whether a component page should show two
different meanings behind the same tab affordance at all, and if not,
which axis loses. Worth settling before more component pages are built.

**Found while wiring Button's examples:** the `asChild` snippet hardcoded
`<span className="primitiv-button__label">`, which is a *styled-only*
class — `wrapTextNodes` and that class live in the copied
`registry/components/button` wrapper, not in the primitive (the span is
needed there because of registry-bugs §5). In headless mode it is plain
text. Exactly the class of bug the tabs make visible: it was invisible
while a reader only ever saw one mode.

**And the default mode is now Styled** (§1.1). Styled is the copy-and-go
path: an install command that produces something that looks finished, and
snippets carrying the very props the examples demonstrate. Only affects
readers with no stored preference.

### 1.27 Landed: the Tabs page, the Anatomy call, and a docs-data drift guard

**Third component page: Tabs** (`/components/tabs`). Adding it confirmed the
page template is genuinely cheap now — generated docs-data, a spec, and three
one-line registrations (`docs-data.ts`, `examples/index.ts`, `nav.ts`); the
route, the TOC and the nav entry all derive. Its examples deliberately cover
what the playground cannot: `size` and `justify` are contract props with
controls already, so the examples demonstrate *headless* behaviour instead —
controlled vs uncontrolled, `activationMode`, `orientation`, and a disabled
trigger.

**Anatomy takes the mode tabs, so multi-path anatomies stack.** Settled
2026-08-22: every code block on a component page carries Styled/Headless,
Anatomy included — it is the block a reader looks up what to *type* in, so it
is the last place that should show one mode's part names while the snippets
below show the other's. That forces the layout, because one `CodeBlock.Tabs` is
a single `Tabs.Root` (one tablist, one value space) and `CodeBlock.Content`
takes a `code` string rather than children, so render-path × mode cannot share
a tablist. Select's two paths therefore stack as labelled blocks, each with its
own mode tabs. The cost is real: tabbing the paths put the alternative in the
same space, which reads better for a comparison. Mode won because it changes
what the reader can actually import, whereas the path is a choice already made
by the time they reach the tree.

**`docs-data` now has a regenerate-all script and a CI guard** —
`node scripts/docs-data/sync-docs-data.mjs` (and `pnpm qa:docs-data` for
`--check`), with the component list moved to `scripts/docs-data/registry.mjs`
so the generator and the sync script cannot disagree about what exists. The
guard regenerates and then asks *git* whether the tree moved, rather than
reimplementing the comparison, and it refuses to run on a dirty tree so
staleness is never confused with work in progress.

It was not hypothetical. Both committed files were stale:

- **`tabs`** missed the extractor change that started carrying data-attribute
  *values* (`105c445f`) — 67 lines — so the Data attributes table would have
  rendered from stale data, `data-state` collapsing two rows into one.
- **`select`** was worse because it was *wrong rather than thin*: its page still
  told readers the `placement` modifier "requires the consumer to wire
  `anchor-name` + `position-anchor`", which `0b550c10` made false when the
  component took that over. Prose the reader would have acted on.

Both were found by running the generator before building a page, which is luck
rather than process — hence the guard. Note the ordering consequence: the guard
fails until the regenerated JSON is committed.

## 2. Open questions

The original six are resolved (§1.8–§1.13, plus §1.5–§1.6); several new
ones surfaced while validating the extraction pipeline against
Button/Tabs (§1.14–§1.17):

1. **Registry coverage for v1 launch — largely resolved by the
   §1.17 re-audit, one decision left.** When this question was written
   only 17 of 41 headless components had a `contract.json`/styled
   surface. As of 2026-08-13 it is **36 of the 40 visual headless
   primitives**; the four without one are `fieldset`, `radio-group`,
   `status` and `toggle`, and each looks deliberate rather than a gap
   (`status` is a bare live region with nothing to style; the other
   three are plausibly folded into `field`, `radio` and `toggle-group`).
   **Remaining decision:** confirm those four are intentional
   fold-ins rather than genuinely missing, and if so record it — after
   which no component's docs page needs a "Styled mode: coming soon"
   state for v1.
2. **Should the docs site's own UI be built with registry/styled
   components** (dogfooding) **or hand-rolled internal CSS?**
   **Effectively settled in favour of dogfooding** by the §1.17
   re-audit: the blocker was that the navigation/breadcrumb pieces were
   headless-only, and `tree`, `breadcrumb` and `breadcrumb-overflow` all
   now have registry surfaces, so building the docs site no longer
   requires building those surfaces first. Left open only as a
   deliberate confirmation.
3. **Where does Figma reference data (`figma.componentSetKey`/node IDs)
   come from structurally?** It currently lives in `ROADMAP.md`'s
   hand-maintained "Figma design coverage" prose table, which also shows
   several components as `—` (no Figma design yet) or `🟡 in progress`
   (e.g. Carousel) — so Figma-mode coverage is incomplete across the
   library, independent of the docs site. Does the docs-data pipeline
   parse that table, or does this data need migrating to something
   structured first?
4. **How does the extraction step handle a prop with both an own-file
   and a `node_modules` declaration** (§1.14's corrected-filter finding)
   — post-process to keep only the own-file description (the practical
   answer, not yet implemented), or something else? Small in scope, but
   needed before the pipeline can be trusted on components beyond
   Button/Tabs, since any component redeclaring `ref`/`children`/or a
   narrowed native attribute (the exact §1.16 `dir` pattern) will hit it.
5. **AI-agent discovery/consumption mechanism (§1.22).** `llms.txt` +
   markdown mirror seems straightforward to fold into the Next.js build
   whenever that starts. The MCP-server piece needs real scoping before
   work starts: where it's hosted, its exact tool surface, whether it
   reads the registry live or from a build artifact (and if the latter,
   how it avoids the same stale-until-rebuilt trap the embedded CLI
   registry has), and whether it ships alongside the docs site launch or
   as a fast-follow.

## 3. Explicitly not yet started

- Visual design / theming of the site itself (deliberately deferred —
  the reading/consumption experience was prioritized first, per the
  planning conversation that produced this doc).
- Any framework scaffolding, page templates, or nav implementation
  (Next.js is chosen per §1.10, but no project has been created).
- Building the docs-data pipeline (§1.12) — the schema (§1.7) and both
  data sources (§1.6, §1.8) are validated/chosen, but no extraction code
  exists yet, including the new Rust subcommand it depends on.
- Authoring the docs-only example files (§1.9).
