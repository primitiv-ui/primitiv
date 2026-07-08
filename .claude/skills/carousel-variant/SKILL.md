---
name: carousel-variant
description: End-to-end playbook for developing one Carousel variant (an example from the backlog — overlay, external-flank, multi-slide, thumbnails, vertical, loop, mouse-drag, autoplay, cover-flow, …) in the kitchen-sink registry surface, following the settled iteration loop. TRIGGER when building/refining a carousel example or variant, adding a carousel placement/orientation, evolving the carousel registry contract/styles, or when the user runs /carousel-variant. SKIP for non-carousel component work, generic registry-component creation (see new-registry-component), and pure token/Figma-variable edits (see figma-bridge-token-sync).
---

# Carousel variant development

The repeatable loop for building **one Carousel example/variant** end-to-end.
The durable context lives in two docs — **read both first, every time**:

- `docs/carousel-development-plan.md` — the settled plan + the 7 locked
  decisions + the styling architecture.
- `docs/carousel-development-log.md` — the running journal: the **Figma design
  reference** (anatomy, exact tokens, frame IDs), per-iteration entries, the
  **backlog** of variants still to build, headless-gap tracker, and open
  questions.

Iteration 1 (basic responsive single-slide) is landed; this skill is for the
variants after it.

## The loop (Build → push → stop for QA)

1. **Load context.** Read the plan + log. Pick the variant (the command's
   argument, or the top of the log's backlog). Restate what it is in one line.
2. **Read the design.** The Figma file "Primitiv Design System" → **"Carousel"
   page** (`941:4508`): **Examples** frame `1033:25214`, **Parts** (anatomy)
   frame `1029:24972`. Pair the Desktop Bridge (`figma_pair_plugin` → give the
   6-char code → wait for the human → **verify with a read**, e.g.
   `figma_execute` returning a node name; the relay is flaky — if it times out
   or says "no plugin", issue a *fresh* code and have them toggle Cloud Mode
   off/on). Screenshot the variant's cell + `figma_execute` its control/slide
   nodes for exact `cornerRadius` / bound-variable names.
3. **Build it in the kitchen-sink.** Add a full-page example route:
   - a component in `apps/kitchen-sink/src/pages/CarouselPage.tsx` (reuse the
     `BasicSingle`/`Example` helpers; compose placement in the example CSS),
   - a `<Route>` in `apps/kitchen-sink/src/Shell.tsx` and a sidebar entry in the
     `EXAMPLES` list in `pages/CarouselLayout.tsx`.
   - Evolve the **registry surface** reactively for anything the variant needs:
     new `--primitiv-carousel-*` knobs, a modifier group (e.g. control
     `placement`, `orientation`), or a new part class — in
     `registry/components/carousel/contract.json` + `styles.css`. Bind every
     value to a real token (`registry-stylesheet-conventions` — no magic
     numbers). The current knob/token map is in the log's design reference.
4. **Regenerate** (only if `contract.json` changed) — the `recipe.ts`/`tsx`/
   `styles.scss` are **generated & drift-guarded, never hand-edited**. Use the
   throwaway-example pattern: write `crates/primitiv-emit/examples/gen_carousel.rs`
   (parse the contract; `emit_recipe` / `emit_wrapper` / `emit_component_scss`;
   write the three files), `cargo run -q -p primitiv-emit --example gen_carousel`,
   then **delete the example**. The carousel drift tests
   (`crates/primitiv-emit/src/{recipe,wrapper,scss}_tests.rs`) then validate it.
5. **Fill headless gaps via TDD** if the variant needs behaviour the primitive
   lacks (**looping/infinite, vertical + `data-orientation`, mouse-drag, RTL** —
   see the log's tracker). Red → green → refactor in `packages/react`, 100%
   lines/branches/functions, per the repo's strict TDD rules. Then consume it.
6. **Hand-sync the kitchen-sink** copy of the surface (what `add` produces):
   `registry/components/carousel/{carousel.recipe.ts,contract.json}` →
   `apps/kitchen-sink/src/components/` (contract as `carousel.contract.json`);
   `styles.css` → `apps/kitchen-sink/src/styles/primitiv/carousel/`; the tsx with
   `import "../styles/primitiv/carousel/styles.css";` prepended. Barrel already
   exports it. Skip `primitiv.lock`.
7. **Run the gates once** at the end:
   `cargo test -p primitiv-emit -p primitiv-cli`,
   `node scripts/check-registry-types.mjs`, and (if headless changed)
   `pnpm --filter @primitiv-ui/react exec vitest run src/Carousel`.
8. **Update the log** — new iteration entry (knobs/modifiers/classes added, gaps
   filled, decisions), tick the backlog, add any open questions.
9. **Push to `main`** (authorised for this workstream — small commits, one per
   red-green or coherent unit) and **STOP for human QA.** Do **not** do the
   Figma variable lockstep yet — that happens only after the human signs off
   (Figma-last, plan decision 2 & 6). Tell them how to view it (`/carousel/<slug>`)
   and what to check.

## Gotchas (bite every session)

- **The kitchen-sink can't build in the sandbox** (no `node_modules`) — the human
  verifies live on `main`. So author React/TS carefully: `noUnusedLocals` +
  `noUnusedParameters` are **strict** — drop every import that a change orphans.
- **Never hand-edit** `carousel.recipe.ts` / `carousel.tsx` / `styles.scss` —
  regenerate from the contract (step 4) or the drift tests fail.
- **Registry changes aren't live for consumers** until a CLI republish (they're
  `include_str!`'d) — but the kitchen-sink hand-sync shows them immediately.
- **`App.tsx` has its own density/size/theme header**; the carousel section uses
  the shared `ChromeControls` (`apps/kitchen-sink/src/chrome.tsx`) — independent
  state by design. Size is currently inert for the carousel (no size modifier yet).
- **Slide radius:** default `md` (`--primitiv-radii-12`) + a `radius` modifier
  (`none`). The Figma `CarouselSlide` base is `cornerRadius:0` (a known oversight
  to fix in the Figma-lockstep pass).

## Definition of done for a variant

Example route + sidebar entry live; registry contract/styles evolved + regenerated
+ drift-green; headless gap (if any) test-driven at 100%; kitchen-sink hand-synced;
gates green; component README updated if the consumer surface changed; log entry +
backlog tick written; pushed; handed to the human for QA (Figma lockstep pending).
