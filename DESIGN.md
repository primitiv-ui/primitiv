# Primitiv — architecture map

This file is a **map, not a source of truth**. It exists so an agent (or a
person) can get oriented in one read before going deeper. It does not
duplicate content that already lives elsewhere:

- **`CLAUDE.md`** — working rules (TDD, coverage gates, git/GitHub
  conventions) and a chronological log of what has shipped. Read it for
  *process* and *history*.
- **`.claude/skills/*`** — procedural playbooks (how to add a registry
  component, how to sync a Figma token, how to scaffold a headless
  primitive, ...). Read one when you're about to do that specific task.
- **`docs/rfcs/`** — the actual decision records. This map tells you which
  RFC to open; it never restates one.

If this file and CLAUDE.md/an RFC disagree, they win — update this file to
match rather than the other way around.

## Two names, one repo

- **Primitiv** — the product: the design system as a whole (tokens, React
  components, registry, CLI, docs site).
- **Harmoni** — the palette-generation engine inside it (`crates/harmoni-*`).
  Public, MIT, and reusable outside Primitiv.

The private plugin that embeds Harmoni into Figma lives in a separate repo,
`primitiv-ui/harmoni`, not here.

## The layer stack

Primitiv is built bottom-up, each layer consuming the one below it:

```
Harmoni engine (Rust/wasm)         crates/harmoni-core, crates/harmoni-wasm
        │  generates OKLCH palettes, contrast-correct foregrounds,
        │  gamut mapping, ramp quality metrics
        ▼
Design tokens (DTCG JSON)          packages/tokens/src/*.json
        │  Palette (primitives, generated) → Intent (semantic roles,
        │  light/dark) → Context (component-scoped, 4 density modes)
        ▼
Token emitter (Rust)               crates/primitiv-emit
        │  one emitter → CSS (canonical) / SCSS / Tailwind, var()-based
        │  so theme + density resolve via the cascade, not inlined values
        ▼
Headless primitives (React)        packages/react/src/*
        │  behaviour + ARIA only, no styling — Radix-shaped compound
        │  components (Root/Trigger/Content/...), published as
        │  @primitiv-ui/react
        ▼
Registry (styled surface)          registry/components/*
        │  copied-in, not imported: contract.json + recipe + .tsx +
        │  styles.css/.scss + README, installed by the CLI
        ▼
Distribution                       crates/primitiv-cli
        `primitiv init/add/tokens/theme/list` — resolves the registry,
        copies files, wires the token layer, tracks primitiv.lock
```

Figma runs **in parallel** to the token/registry layers, not below them: it
is the design source of truth for composite/composed components (Figma
first, always — see CLAUDE.md's non-negotiable #9) and its variables mirror
the same Palette/Intent/Context tokens. The two are kept in lockstep by hand
(`figma-bridge-token-sync` skill), not generated from one source.

## Component tiers

Not every entry in `registry/components/` has a `packages/react` primitive
behind it. Three shapes, by how much genuinely new ARIA/keyboard behaviour
the component needs:

1. **Headless primitive + registry skin** — most interactive components
   (Button, Dropdown, Select, Tabs, Modal, ...). Behaviour lives in
   `packages/react`, styling in the matching `registry/components/` entry.
2. **Hand-authored, primitive-less registry leaf** — no new behaviour, so no
   `packages/react` component exists at all: structure + styling only
   (layout primitives per RFC 0022 — `box`/`stack`/`grid`/...; prose
   components per RFC 0023 — `list`/`blockquote`/`kbd`/`figure`/...; `badge`/
   `tag`; `inline-code`/`code-block`).
3. **Tier 1 composites** — compose ≥2 existing components with no new ARIA
   pattern, per RFC 0021. Always **Figma-first**: composing existing
   primitives still surfaces real visual decisions (new token families,
   focus-ring anatomy, slot structure) that only show up once you're looking
   at the composition. Examples: `confirm-dialog` (Modal + Button),
   `avatar-group` (Avatar), `breadcrumb-overflow` (Breadcrumb + Dropdown),
   `card`.

The authoritative per-component classification (kind, contexts, test count,
one-line notes) is generated at
`.claude/skills/new-react-component/_generated/component-inventory.md` —
check there before guessing which tier an existing component sits in.

## Definition of done

A behaviour change in `packages/react` ships with: a new/updated test, JSDoc
updated to the docgen bar, and a README update if it's consumer-facing. A
**new** component additionally needs: a row in `packages/react/README.md`'s
component table, a kitchen-sink example (never a workbench page — see
below), and its `ROADMAP.md` checkbox ticked. Full detail in CLAUDE.md
under "Definition of done for any component change" — this is just the
checklist, not the reasoning.

## Repo map

| Path | What it is | Go deeper |
|---|---|---|
| `crates/harmoni-core`, `crates/harmoni-wasm` | Palette engine (pure Rust / wasm boundary) | `rust-wasm-workflow`, `harmoni-architecture-history` skills |
| `crates/primitiv-cli` | The `primitiv` CLI (init/add/tokens/theme/list) | `rust-cli-test-conventions` skill, RFC 0005/0007 |
| `crates/primitiv-emit` | DTCG → CSS/SCSS/Tailwind emitter | RFC 0006 |
| `packages/tokens/src/*.json` | Palette/Intent/Context DTCG sources | RFC 0001, `figma-variable-architecture` skill |
| `packages/react/src/*` | Headless component library (`@primitiv-ui/react`) | `new-react-component`, `react-component-patterns`, `react-test-conventions` skills |
| `packages/icons` | Icon set (published, MIT) | `figma-icon-glyph` skill |
| `registry/components/*` | Styled, copied-in component surfaces | `new-registry-component`, `registry-stylesheet-conventions` skills |
| `apps/docs-site` | Public docs site (primitiv-ui.dev) | `docs-site-component-page`, `docs-site-planning` skills |
| `apps/kitchen-sink` | Current example surface for new components | `new-registry-component` skill |
| `apps/workbench` | Legacy iteration surface — **frozen**, don't expand | `workbench-examples` skill |
| `apps/primitiv-sync-figma-plugin` | Figma → DTCG token backup plugin | `figma-token-sync` skill |
| Figma file(s) | Design source of truth for composites, component descriptions | `figma-component-descriptions`, `figma-framed-control-component`, `figma-prose-component` skills |
| `docs/rfcs/` | Architecture decision records | index below |
| `docs/transfer-and-next-steps.md` | Live build-phase checklist | — |

## RFC index

Full titles, statuses, and summaries live in `docs/rfcs/README.md` — this is
just the map of categories so you know where to look:

- **Token & engine** (0001–0003, 0017, 0025, 0027) — the layered token stack,
  Harmoni→Intent wiring, dynamic foreground contrast, elevation/shadow
  tokens, responsive breakpoints, ramp quality metrics.
- **Consumption layer** (0004–0009, 0016, 0020) — distribution model, the
  CLI, the token/style pipeline, CSS cascade-layer architecture, theme/
  density mode scoping, spacing/flow rhythm, the agent manifest/MCP server.
  Read 0004 → 0005 → 0006 in order.
- **Input & tooling** (0010, 0011) — the OKLCH colour picker, duotone neutral
  ramps.
- **Figma library** (0012, 0014, 0015) — the web typography build, Table,
  Figure/Figcaption.
- **React components** (0019, 0021–0024) — Navigation Menu, composite
  components (the Tier 1 model above), layout primitives, prose/content
  components, app-shell/marketing patterns.
- **Evaluation** (0026) — consumer testing with agent personas.

Note: RFC 0013 and 0028 (Harmoni-plugin-specific) moved to the private
`primitiv-ui/harmoni` repo; new RFC numbers here continue from 0029.

## Where things stand right now

CLAUDE.md's "Current state" section is the living, detailed changelog (what
landed, what's mid-flight, hard-won gotchas). The one-line version: the
primitive layer is essentially complete, the CLI is v1 feature-complete and
all packages are published to npm/JSR, and current work is Tier 1 composites
(RFC 0021) plus bringing `apps/docs-site` up to full component coverage. For
anything more specific than that, CLAUDE.md is more current than this file
will ever be — treat this section as a pointer, not an answer.
