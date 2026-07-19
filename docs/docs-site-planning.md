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

---

## 2. Open questions

None currently blocking further planning — all six questions originally
logged here are resolved (§1.8–§1.13, plus §1.5–§1.6). A few
implementation-level details were deliberately left for the
implementation phase rather than decided speculatively here (see the
"Not yet decided" notes inside §1.9 and §1.12). New questions should be
logged here as they come up, the same way the original six were.

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
