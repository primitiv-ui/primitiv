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

## Sequencing (current best guess)

The two open threads are the same thread. You can't safely parallelize until
you've stepped out of the single loop; you can't step out until your
interventions are encoded as guardrails. Path:
1. Convert recurring course-corrections into guardrails (specs, plan-gate, checks).
2. Let the agent close its own CI loop on one PR (`subscribe_pr_activity`).
3. Close one broken environment loop (UI self-verification).
4. *Then* fan out across parallel sessions/worktrees.
