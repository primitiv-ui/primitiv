---
name: docs-site-planning
description: Continuing the planning for Primitiv's public docs website — the professional, public-facing site distinct from the workbench/kitchen-sink POC surfaces. Covers the consumption-mode switch (headless/styled/Figma), the audience-forked nav structure, and the generated (not hand-maintained) prop-data schema. TRIGGER when picking up docs-site planning work, deciding an open question logged in docs/docs-site-planning.md, designing the docs nav/layout, or building the prop-data extraction pipeline. SKIP for the existing workbench/kitchen-sink example pages (see workbench-examples), and for the underlying distribution/CLI model itself (see docs/consumption-design.md and RFCs 0004-0006, which this planning doc does not replace).
---

# Primitiv docs site planning

The public docs site is still in the planning stage — no implementation
has started. Read `docs/docs-site-planning.md` first, every time; it is
the durable record of what's decided and what's open, not this file.

## What this skill is for

Resuming or extending the docs-site planning conversation across
sessions, and now driving implementation — the original six open
questions in `docs/docs-site-planning.md` §2 are all resolved (§1.8–1.13):
`react-docgen-typescript` for headless props, separate docs-only
examples, Next.js, latest-only (no versioning) for v1, a Node/TS
orchestrator shelling out to a new Rust JSON subcommand for the
docs-data pipeline, and keeping both the per-component inline install
block and the standalone Registry & CLI section.

## The core constraint driving every downstream decision

Primitiv is consumed through genuinely different lenses (headless-only,
headless + installed registry styles, Figma), and the **same component
has a different API surface per lens** — most concretely, its props
table. That means:

- The docs site is a **consumer of generated data**, not hand-authored
  content, for anything that already exists as structured source (props,
  contract.json additions, CSS variable bindings, dependsOn). See
  `docs/docs-site-planning.md` §1.5–1.7 for the draft schema and exact
  sourcing per field.
- The consumption-mode switch is global/persistent (§1.1), not a
  per-page toggle — don't redesign this without a clear reason logged
  back into the doc.

## Workflow

1. **Read `docs/docs-site-planning.md` in full** before making or
   proposing any decision — it has the settled structure (§1) and the
   exact list of open questions (§2) in priority order.
2. **When a question in §2 gets resolved**, move it from §2 into a new
   or extended §1 subsection in the same doc, with the rationale — don't
   just implement silently. The doc is the source of truth for future
   sessions, not this conversation's history.
3. **Before extending the prop-data schema (§1.7)**, validate against a
   real file — e.g. read an actual `registry/components/*/contract.json`
   and a headless component's JSDoc in `packages/react` — rather than
   extending the draft shape speculatively. `crates/primitiv-emit`
   already parses `contract.json` (`src/contract.rs`, `src/wrapper.rs`) —
   reuse it for the styled/contract half instead of writing a second
   parser (§1.6), surfaced as a new JSON-emitting subcommand per §1.12.
4. **Docs examples are their own files (§1.9), not embeds of workbench/
   kitchen-sink.** Don't touch those apps as part of this work unless a
   question explicitly requires it — they're a separate POC surface per
   the `workbench-examples` skill and the root `CLAUDE.md`.
5. **This doc doesn't replace `docs/consumption-design.md` or RFCs
   0004–0006.** Those own the distribution/styling-contract model. This
   planning doc is strictly about how that model gets *documented* on the
   public site. If a question turns out to actually be about the
   distribution model itself, it belongs in an RFC, not here.
