# Workflow loops — working notes

A living doc for refining how we (human + agent) work together. The frame:
**"my job is to write the loops."** A *loop* is: agent acts → an automated
signal says pass/fail → agent corrects → repeat, with no human in the middle of
each iteration. The human's work is to design those loops and the specs that
feed them, then step out — re-entering only at boundaries they chose.

Update this as the workflow evolves. The diff is the record.

## Loops we already have (the strong base)

- **100% lines + regions + functions** gate in `rust.yml` (`cargo llvm-cov`).
  The regions gate is the real teeth — catches the untested branch a lines-only
  check waves through. Hardest loop component to get right; already in place.
- **Strict TDD** — red/green is a per-cycle local loop with a binary outcome.
- **Scoped test runs** (`vitest run src/X`) — sub-second inner-loop feedback,
  which is what makes autonomous iteration economical.
- **Deterministic environment** — SessionStart hook stubs the wasm pkg + frozen
  install, so every cold container converges to the same green baseline.
- **Pre-approved allowlist** in `settings.json` — fewer permission prompts =
  fewer places the loop breaks and waits for a human.
- **Context loops** — skills (trigger/skip frontmatter, loaded on demand), RFCs,
  decision logs (D1–D50), and a `definition of done` that makes the agent update
  its own context artifacts.

## Where the human is still inside the loop

1. **Review at the cycle boundary, not the batch boundary.** One human-driven
   commit per red-green cycle. Deliberate quality choice, but it keeps the human
   on every iteration. The move: feed an RFC with executable acceptance criteria,
   let N cycles run against the 100% gate, review the *batch* diff.
2. **PR loop not closed by the agent.** `subscribe_pr_activity` lets the agent
   watch its own PR, see CI go red, re-diagnose, and push a fix unattended.
   Highest-leverage, lowest-effort change available.
3. **Single-threaded.** One session, one branch. Throughput comes from fan-out —
   independent loops in parallel, each gated by the same CI.

## Broken loops in our own environment (force the human back in)

- **Workbench un-runnable in-container** (`sandbox-gotchas`). For a UI library,
  the agent can't *see* a component behave — the human is the eyes. Biggest
  structural gap; environmental, not discipline.
- **Playwright e2e deleted**, **wasm-pack unavailable** → integration loop and
  engine build loop stubbed in-session.

Documenting a broken loop keeps the human in it forever. Closing each one is
where we stop being needed: a headless/jsdom interaction-or-screenshot harness
for `packages/react`; wasm-pack in the container for the engine loop.

## Open threads (in discussion)

### Course-correction vs. raising the review boundary
Concern: manual course-corrections have prevented real drift; raising the
boundary risks losing that safety net.

Working answer (to refine): **every course-correction is a loop not yet
written.** Don't stop watching — convert. When you catch a drift, ask "what
spec constraint, automated check, or up-front plan-gate would have caught this
without me?" then encode it. Distinguish:
- *Direction/objective drift* → fix up front with a **plan-approval gate**
  (lock the approach before any code; then implementation can run unwatched).
- *Implementation drift* → fix with **tests / lint / architectural constraints**.
The interventions you must make should trend toward zero; the ones that remain
are genuine novel judgement — which is the only thing worth your attention.

### Parallel agents — how to actually do it
- **Web / iPhone app:** each session = its own cloud container = its own loop.
  Parallelism is mundane: start task A in one session, task B in another, each
  scoped to its own branch. The infra is already there — we just start one
  at a time today.
- **Local CLI:** `git worktree add` for isolated checkouts, one Claude session
  per worktree; or background agents.
- **Precondition:** parallel only pays off when each task is *independent* and
  has a *closed loop*. Fanning out loops you still babysit multiplies
  supervision, not throughput. So this waits on the course-correction thread.

### Cross-session interference — the concurrency model
The "update docs/skills/rfcs after each session" practice is a **sequential
consistency model**: it works because there's a total order (session N writes
learnings → N+1 reads them). Parallel sessions break that order → stale reads
and write-write conflicts on the **shared spines**: `CLAUDE.md`, skills, rfcs,
`ROADMAP.md`, the 13 version fields, the registry, generated inventory.

The confidence test is mechanical, not a vibe:
> Two sessions are safe in parallel iff their **write sets are disjoint** and
> neither depends on a learning the other is currently producing.

Principle: **divergent work parallelizes; convergent (knowledge) work
serializes.** Fan out N implementation cycles, then converge in one session that
harvests learnings into docs/skills/rfcs.

## Flows catalogue (seeded from skills + commands — A-draft, correct me)

Each recurring task shape. The per-flow **blast radius** does double duty:
(a) the drift-point is where a plan-gate goes (loop guardrail); (b) intersecting
two flows' write sets answers "can I parallelize these?". Spines marked
**[spine]** are shared mutable surfaces — the reverse index at the end maps each
spine to the flows that write it.

Per flow: **Trigger · Sequence · Reads · Writes (blast radius) · Drift-point ·
Closing signal · Parallelism.**

### 1. Add a new React component
- **Trigger:** "scaffold X" / "new component" for a component not yet in
  `packages/react`.
- **Sequence:** `/scaffold-component` (RED commit) → human-driven green/docs
  cycles → definition-of-done checklist.
- **Reads:** `new-react-component`, `react-component-patterns`,
  `react-test-conventions` skills; component-inventory.
- **Writes (blast radius):**
  - `packages/react/src/<Component>/**` — *isolated, safe to parallelize*.
  - `packages/react/README.md` components table — **shared spine**.
  - `apps/workbench/src/pages/**` + `App.tsx` router — **shared spine** (`App.tsx`).
  - `ROADMAP.md` checkbox — **shared spine**.
  - generated component-inventory — **shared/generated**.
- **Drift-point:** the component's API/anatomy *before* tests are written →
  wants a plan-gate on the public surface.
- **Closing signal:** `pnpm --filter @primitiv-ui/react vitest run src/<Component>`
  green at 100% coverage.
- **Parallelism note:** even this "self-contained" flow touches **four** shared
  spines. Two parallel new-component sessions *will* collide on `App.tsx` and the
  README table — so the divergent code parallelizes, but the doc-table / router /
  roadmap / inventory edits are a convergence point to serialize or assign to one
  session.

### 2. Change an existing React component
- **Trigger:** new prop / changed default / new pattern on a component already in
  `packages/react`.
- **Sequence:** red-green(-refactor) cycle → definition-of-done (test, JSDoc,
  component README; table row only if consumer-facing).
- **Reads:** `react-component-patterns`, `react-test-conventions`.
- **Writes:** `packages/react/src/<Component>/**` (*isolated*); its `README.md`;
  `packages/react/README.md` table **[spine]** *only* if consumer-facing.
- **Drift-point:** scope creep beyond the stated behaviour change → plan-gate the
  prop/contract delta.
- **Closing:** `vitest run src/<Component>` green at 100%.
- **Parallelism:** isolated unless two sessions touch the same component or a
  shared util; doc-table edits converge.

### 3. Extend the harmoni engine (Rust/wasm)
- **Trigger:** new palette/neutral function or behaviour in `harmoni-core`.
- **Sequence:** red-green in `harmoni-core` → mirror type + `From` conversion in
  `harmoni-wasm` → regenerate `.d.ts` → `build:wasm`.
- **Reads:** `rust-wasm-workflow`, `harmoni-architecture-history`,
  `dark-mode-palettes`.
- **Writes:** `crates/harmoni-core/<module>` (*isolated per module*);
  `crates/harmoni-wasm` mirror layer + generated `.d.ts` **[spine]**;
  `Cargo.lock` **[spine]** if deps change.
- **Drift-point:** *where logic lives* (core vs wasm) and the api-module boundary
  → plan-gate the core/wasm split before coding.
- **Closing:** `cargo test --workspace`; wasm rebuilds clean.
- **Parallelism:** core modules partition well; the wasm mirror + `.d.ts` +
  `Cargo.lock` are convergence surfaces.

### 4. Add/change a CLI command or token emitter
- **Trigger:** new `primitiv` subcommand, emitter format tweak, or registry change.
- **Sequence:** unit → command → e2e per the ports-&-adapters seam; golden files
  hand-authored.
- **Reads:** `rust-cli-test-conventions`.
- **Writes:** `crates/primitiv-cli/**`, `crates/primitiv-emit/**` (*command
  modules fairly isolated*); golden files; `registry/components/**` **[spine]**;
  `Cargo.lock` **[spine]**.
- **Drift-point:** command surface / which effect goes behind which port →
  plan-gate the trait seam.
- **Closing:** `cargo llvm-cov … --fail-under-{lines,regions,functions} 100`.
- **Parallelism:** registry edits + `Cargo.lock` converge. **Registry gotcha:** a
  registry change is *not live* until the CLI binary is rebuilt (`include_str!`).

### 5. Add a Figma icon glyph + icons package
- **Trigger:** new glyph (sun, moon, …).
- **Sequence:** draw in Figma Icon set (house line style) → export SVG → drop in
  `packages/icons/icons/svg/` → `generate` → README/index/test loop.
- **Reads:** `figma-icon-glyph`.
- **Writes:** Figma Icon set **[Figma doc]**; `packages/icons/icons/svg/<name>.svg`;
  generated `packages/icons/src/icons/*.tsx` **[spine/generated]**;
  `index.ts` **[spine]**; `packages/icons/README.md` **[spine]**; a test.
- **Drift-point:** glyph style consistency with the house line → review the
  stroke→outline build before export.
- **Closing:** `pnpm --filter @primitiv-ui/icons generate` + tests green.
- **Parallelism:** `index.ts`, README, generated dir are spines → two icon
  sessions collide; serialize or batch glyphs in one session.

### 6. Build/extend a Figma framed-control component
- **Trigger:** new/extended Button-class control, variant fill-in, anatomy audit.
- **Sequence:** anatomy → variable binding → component-property wiring → arrange
  grid → **write the component description (mandatory last step)**.
- **Reads:** `figma-framed-control-component`, `figma-variable-architecture`,
  `figma-arrange-component-set`, `figma-component-descriptions`.
- **Writes:** the Figma file **[Figma doc — one shared mutable canvas]**;
  variables collection.
- **Drift-point:** anatomy/token binding + focus-ring geometry → plan-gate the
  variable bindings before building.
- **Closing:** visual correctness + description written.
- **Parallelism:** the Figma file is a *single shared document* — parallel Figma
  sessions are inherently high-collision. **Serialize all Figma work.**

### 7. Create/style a Figma wireframe
- **Trigger:** wireframe or layout from existing components.
- **Sequence:** describe UI → write console script (allow-paste, load fonts) →
  run → screenshot.
- **Reads:** `figma-console-scripts`, `figma-wireframe-tokens`.
- **Writes:** the Figma file **[Figma doc]**.
- **Drift-point:** layout intent before the script runs → confirm the plan, since
  a script mutates the canvas in bulk.
- **Closing:** screenshot matches intent.
- **Parallelism:** shared Figma file → serialize with all other Figma flows.

### 8. Token sync (Figma → repo DTCG)
- **Trigger:** back up Figma variables, add a collection, extend the transform.
- **Sequence:** plugin / live-sync (`localhost:4477`) → DTCG JSON written to repo.
- **Reads:** `figma-token-sync`.
- **Writes:** `packages/tokens/**` DTCG JSON **[spine — token source of truth]**;
  `apps/primitiv-sync-figma-plugin` if transform changes.
- **Drift-point:** collection routing / DTCG shape → plan-gate the routing.
- **Closing:** `packages/tokens` tests green.
- **Parallelism:** `packages/tokens` is the upstream the CLI emitter consumes —
  **serialize against flow 4** (emitter) and against Figma component work.

### 9. Release / publish
- **Trigger:** ship a version.
- **Sequence:** `scripts/bump-version.mjs 0.x.y` → Release workflow → Publish
  workflow (manual dispatch on `main`).
- **Reads:** `RELEASING.md §5–6`, `docs/transfer-and-next-steps.md`.
- **Writes:** **13 version fields** (10 `package.json` + 3 `jsr.json`) + 5
  wrapper `optionalDependencies`, tags, GitHub Release **[global — touches every
  package]**.
- **Drift-point:** version target + lockstep correctness → never hand-edit
  versions; the script is the gate.
- **Closing:** Publish workflow green; `jsr publish --dry-run` clean.
- **Parallelism:** **globally exclusive** — nothing else runs concurrently with a
  release; it touches the whole tree.

### 10. Add a workbench example page (standalone)
- **Trigger:** example for an existing component (vs. bundled with a new one).
- **Sequence:** page under `apps/workbench/src/pages` → wire into router → scoped
  example CSS.
- **Reads:** `workbench-examples`.
- **Writes:** `apps/workbench/src/pages/**`; `App.tsx` router **[spine]**;
  example `.css` (**global-bundling gotcha** — bare selectors leak across pages).
- **Drift-point:** the CSS-leak gotcha → keep selectors scoped.
- **Closing:** *visual* — but **the workbench is un-runnable in-container (broken
  loop)**; today the human is the only verifier here.
- **Parallelism:** `App.tsx` is a spine; the global-CSS leak is a cross-page
  hazard even across sessions.

## Shared-spine reverse index (the parallelism lookup)

Before running two sessions, check whether their flows share a row. Same row →
serialize that surface (or assign it to one session); no shared row → safe to fan
out.

| Shared spine | Written by flows |
| --- | --- |
| `apps/workbench/src/App.tsx` (router) | 1, 10 |
| `packages/react/README.md` (components table) | 1, 2 (if consumer-facing) |
| `ROADMAP.md` | 1 (+ any roadmap tick) |
| `packages/icons/{index.ts, README.md, src/icons/*}` | 5 |
| `packages/tokens/**` (DTCG source) | 8 → consumed by 4 |
| `registry/components/**` (+ `include_str!` rebuild) | 4 |
| `Cargo.lock` | 3, 4 |
| `harmoni-wasm` mirror + generated `.d.ts` | 3 |
| 13 version fields | 9 (global-exclusive) |
| The Figma document (one canvas) | 5, 6, 7 |
| `CLAUDE.md` / skills / rfcs | any convergence/knowledge session |

Reading: the *cleanest fan-outs* are independent instances of flows 2, 3, 4
(different components / core modules / commands) **provided** the doc-table /
mirror / registry convergence edits are batched into one closing session. All
Figma flows (5–7) share one canvas → serialize. Release (9) is exclusive.

## Sequencing (current best guess)

The two open threads are the same thread. You can't safely parallelize until
you've stepped out of the single loop; you can't step out until your
interventions are encoded as guardrails. Path:
1. Convert recurring course-corrections into guardrails (specs, plan-gate, checks).
2. Let the agent close its own CI loop on one PR (`subscribe_pr_activity`).
3. Close one broken environment loop (UI self-verification).
4. *Then* fan out across parallel sessions/worktrees.
