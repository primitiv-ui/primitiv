# Primitiv RFCs

Architecture decision records for Primitiv / Harmoni. Each RFC carries its own
status, summary, and decision record; this page is the index.

## Token & engine architecture

| # | Title | Status |
|---|---|---|
| [0001](0001-token-architecture.md) | Primitiv Token Architecture | Draft |
| [0002](0002-harmoni-to-intent-to-plugin.md) | Harmoni → Intent → Plugin | Phase B complete; Phase C in progress |
| [0003](0003-dynamic-foreground-wiring.md) | Dynamic foreground wiring | Implemented (engine + sync-plugin + DTCG) |

- **0001** — the six-pattern layered token stack (primitives → intent → role →
  anatomy → interaction → component), the contexts model, and the Button worked
  end to end.
- **0002** — wiring the Harmoni palette engine through the Intent layer into the
  Figma plugin.
- **0003** — letting the engine's computed, contrast-correct foreground flow all
  the way through instead of being replaced by a static guess.

## Consumption layer

How consumers (human and agent) install and configure Primitiv. Settled across
the 2026-06-09 design discussion; the narrative and the full D1–D25 decision log
live in [`../consumption-design.md`](../consumption-design.md).

| # | Title | Status |
|---|---|---|
| [0004](0004-consumption-distribution-and-styling-contract.md) | Consumption distribution model & styling contract | Draft |
| [0005](0005-primitiv-cli.md) | The Primitiv CLI | Draft |
| [0006](0006-token-and-style-pipeline.md) | Token & style pipeline | Draft |
| [0007](0007-cli-development-and-test-strategy.md) | CLI development & test strategy | Draft |

- **0004** — the foundation: the hybrid model (versioned headless packages +
  opt-in copy-in styles) and the four-part styling contract (root class +
  modifier classes + `data-*` state + `--primitiv-*` custom-property API).
- **0005** — the `primitiv` Rust CLI: commands, `primitiv.json`, the safe `add`
  flow, the static registry, distribution, and the pnpm/npm/yarn/bun invocation
  cookbook.
- **0006** — one Rust emitter → all four token formats, light theme + evolvable
  dark tokens, and the Figma-sourced default theme authored in the workbench.
- **0007** — how the CLI is built test-first: ports & adapters (pure core, faked
  effects), the test pyramid, hand-authored golden files, 100% coverage, and
  Rust entering CI.

Read **0004 → 0005 → 0006** in order; each builds on the one before. **0007** is
the build/test strategy for 0005–0006 and applies once implementation starts.
