---
description: Develop one Carousel variant end-to-end as an example on the docs site's Carousel page — read the design, build the example + evolve the registry styles (regenerate + drift-test), TDD any headless gap, run the gates, update the log, push to main, then stop for human QA. Figma variable lockstep stays after QA.
argument-hint: <variant, e.g. "overlay" | "external-flank" | "multi-slide" | "thumbnails" | "vertical" | "loop" | "mouse-drag" | "autoplay">
---

You are developing the Carousel variant: **$ARGUMENTS** (if empty, take the top
unbuilt item from the backlog and confirm it in one line).

1. **Load the `carousel-variant` skill** (Skill tool) and follow its loop. Read
   `docs/carousel-development-plan.md` and `docs/carousel-development-log.md`
   first — the log carries the Figma anatomy/token map, frame IDs, the backlog,
   and the headless-gap tracker.

2. **Confirm the variant** in one line (what it is, which design cell it maps to,
   what new knobs/modifiers or headless behaviour it likely needs). Pull in
   `registry-stylesheet-conventions`, `new-registry-component`,
   `react-test-conventions`, `figma-bridge-token-sync`, and `sandbox-gotchas` as
   the work needs them.

3. **Run the loop** — read the Figma frame → build the example (an entry in
   `apps/docs-site/src/site/examples/carousel.tsx`) + evolve the
   registry surface reactively (regenerate the recipe/tsx/scss from the contract
   via the throwaway `primitiv-emit` example if the contract changed; the drift
   tests validate) → TDD any headless gap in `packages/react` at 100% → hand-sync
   the docs site → run the gates → update the log → push to `main`.

4. **Stop for human QA.** Do **not** do the Figma variable lockstep — that is
   after sign-off (Figma-last). Tell the human where to view it
   (`/components/carousel/#<example-id>`)
   and what to check (responsiveness, keyboard, RTL, the variant's specific
   behaviour). The Figma lockstep + any tuning happen once they've looked.

Keep commits small (one per red-green cycle or coherent unit), messages to a
subject + one sentence, with the session footer.
