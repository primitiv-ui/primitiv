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
DOM attribute (`onClick`, every `aria-*`, `style`, …). Verified against a
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

### 1.17 New gap found: the docs site itself needs components that don't exist yet

Cross-checked the 41-component headless inventory
(`.claude/skills/new-react-component/_generated/component-inventory.md`)
and the 17-component registry (`registry/registry.json`) against what a
docs UI structurally needs. Most of it is already covered — `Tree`
(nav sidebar), `Breadcrumb`, `Table` (props tables), `Accordion`/
`Collapsible` (collapsible nav/FAQ sections), `code-block`/`inline-code`
(already registry components, built for this), `prose` (already the
flow-rhythm foundation RFC 0016 built, i.e. the reading-experience base),
`SkipNav`, and `ToggleGroup` (a plausible fit for the mode-switch control
itself — already has a registry surface, so no new component needed
there). **Missing entirely:**

- **Callout / admonition** (info/warning/tip boxes) — not in the
  inventory at all.
- **Badge / status pill** (stable/beta status, required-prop indicator)
  — not in the inventory at all.
- **Search / command palette** — the biggest gap; `Select`'s
  Combobox/Command gap is already tracked in `docs/select-future-work.md`,
  this would build on closing that.

`Tree` and `Breadcrumb` exist headless but have no registry/styled
surface — relevant only if the docs site itself should be built the
"eat your own dogfood" way (styled registry components) rather than
one-off internal CSS; not yet decided, see open question 2 below.

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
  block (the per-component "Getting this component" block, §1.13) carries
  **npm / pnpm / yarn / bun** tabs so the reader copies the command for
  their own manager; npm is the default/active tab. (The at-a-glance
  install *chips* on the three consumption-path cards stay single-line —
  the tabbed block is the interactive one.)

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

---

## 2. Open questions

The original six are resolved (§1.8–§1.13, plus §1.5–§1.6); several new
ones surfaced while validating the extraction pipeline against
Button/Tabs (§1.14–§1.17):

1. **Registry coverage for v1 launch.** Only 17 of 41 headless components
   have a `contract.json`/styled surface (§1.17's component check). Every
   other component's docs page would only ever render "Headless" mode
   content. Is a "Styled mode: coming soon" state acceptable per-component
   for v1, or does registry coverage need to expand first (and if so, how
   far — everything, or just what the docs site itself uses)?
2. **Should the docs site's own UI be built with registry/styled
   components** (dogfooding — `primitiv add tree`, `primitiv add
   breadcrumb` after building their registry surfaces) **or hand-rolled
   internal CSS**, for the navigation/breadcrumb pieces that are
   currently headless-only (§1.17)? Affects whether building the docs
   site first requires building those registry surfaces first.
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
