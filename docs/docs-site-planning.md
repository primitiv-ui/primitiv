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

**Open sub-question (not yet resolved):** is there a distinct third code
mode — "npm package" as separate from "registry" — or are those the same
mode with a different install command? Needs to be confirmed against how
`consumption-design.md` §1's hybrid distribution model actually maps to
reader-facing modes before the switch is built.

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

**Known tension, not yet resolved (flagged in discussion, not fixed):**
the "Registry & CLI" section and the mode switch on Components pages
overlap. A styled-mode reader needs the install command (`primitiv add
<name>`) inline on the component page, not just cross-referenced to a
separate CLI section. Leaning towards a small mode-aware "Getting this
component" block per component page (shows `npm install` in headless
mode, `primitiv add` in styled mode) rather than forcing cross-navigation
— but this hasn't been designed in detail.

### 1.5 Props tables must be generated, not hand-maintained

This is treated as a hard architectural constraint, not a nice-to-have.
Rationale: three consumption modes × N components means hand-maintained
tables will drift immediately and silently. The docs site must be a
**consumer of structured data extracted from source**, the same shape of
problem as the token emitter (`primitiv-emit`) already solves for
DTCG → CSS/SCSS/Tailwind.

### 1.6 Draft prop-data schema (per component, composed from two sources)

Composition happens **at build time**, not runtime: a docs build step
walks real source/contract files and emits per-component JSON, which the
site then renders. Draft shape:

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
    "contractProps": [ /* FROM: contract.json — style-layer additions on top of headless props */ ],
    "cssVariables": [ /* FROM: token emitter category map + contract.json token bindings */ ]
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
- `headless.*` — extracted from `packages/react` TSDoc/JSDoc.
- `styled.*` — extracted from each registry component's `contract.json`
  and `registry.json`, diffed against the headless prop list.
- `figma.*` — from stored Figma node/component-set references.
- `a11y.*` — hand-authored (schema-shaped for consistent rendering, but
  not auto-generatable).
- `examples[].sourceFile` — convention-based, see open question 2.6 below.

---

## 2. Open questions (not yet decided)

These are blocking or near-blocking for implementation. Listed roughly in
the order they'd need resolving.

1. **Headless vs. registry vs. npm-package as distinct modes.** Confirm
   against `consumption-design.md`'s actual distribution model (§1,
   points 1–4) whether "npm package" is a third reader-facing mode or
   folded into "styled."
2. **Examples: single source or two?** Should the public docs demo *be*
   the existing workbench/kitchen-sink example (embedded), reusing the
   "Definition of done" workbench example that every new component
   already ships with — or a separate, more polished example file
   authored just for docs? Reusing avoids duplication; workbench is
   explicitly documented as "not a production surface," so embedding it
   live on a public site blurs that boundary.
3. **Headless prop extraction tooling.** Extracting `props` + JSDoc from
   TSX needs either a dependency like `react-docgen-typescript` or a
   hand-rolled TS-compiler-API walk. The repo has a general bias toward
   minimal dependencies (see harmoni-core's 3-direct-deps discipline) —
   worth deciding deliberately rather than defaulting to the first
   library found.
4. **contract.json → docs delta mapping.** Does `contract.json`'s current
   shape cleanly separate style-layer-only props from pass-through
   headless props, or does the extraction script need to compute the
   diff itself against the headless prop list? Needs checking against a
   real `contract.json` (e.g. `registry/components/button/contract.json`)
   before the schema in §1.6 is locked.
5. **Where the extraction script lives.** Candidate: a new
   `scripts/generate-docs-data.mjs` or a small crate alongside
   `primitiv-cli`/`primitiv-emit`, run in CI, output committed as JSON so
   docs builds don't re-run TS-AST parsing and prop changes are visible
   in PR diffs.
6. **Versioning.** Does v1 of the docs site need version-pinned docs, or
   is "docs always track main/latest" acceptable until multi-version
   support is actually needed?
7. **Docs site framework choice.** Deferred until the schema above is
   validated against real files — but whatever is chosen needs solid
   build-time data-fetching into per-page dynamic content (e.g.
   Astro/Next-style), not a purely static Markdown tool with no data
   layer.
8. **Registry & CLI section vs. per-component inline install** (see
   §1.4's flagged tension) — needs an actual layout decision, not just a
   leaning.

## 3. Explicitly not yet started

- Visual design / theming of the site itself (deliberately deferred —
  the reading/consumption experience was prioritized first, per the
  planning conversation that produced this doc).
- Any framework scaffolding, page templates, or nav implementation.
- Validating the §1.6 schema against real `contract.json` files.
