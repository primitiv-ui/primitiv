# Carousel development plan

> **Durable reference.** This is the plan and the settled decisions for
> developing the styled Carousel. The running journal (per-iteration
> entries, live backlog, open questions) lives alongside it in
> [`carousel-development-log.md`](./carousel-development-log.md). Start
> every session by reading both.

## Context

The **Carousel** is a milestone component for Primitiv. The headless
primitive (`packages/react/src/Carousel/`) is already mature — 9
sub-components, 23 test files, a WAI-ARIA-compliant surface built on
native CSS scroll-snap, shipping **zero styles**. What does *not* yet
exist is a **styled registry surface** (`registry/components/carousel/`
is greenfield) or any demonstration of it as an installed, composable,
responsive component.

This plan establishes a **repeatable development loop** for translating
designs into working, responsive registry styles — one example at a
time, each QA'd by the human, with a persistent log so context survives
across sessions. The end goal: best-in-class DX/UX, modern CSS (grid,
logical properties, RTL, container-adaptive by default), and a feature
set matching Blossom / Ark UI.

## Locked decisions (the knowledge base — read this first every session)

Captured from the kickoff Q&A. These are settled; do not re-litigate:

1. **Target app = `apps/kitchen-sink`, NOT `apps/workbench`.** Forget the
   workbench Carousel page. All styling is developed and verified in the
   kitchen-sink (the consumer-copied surface). Carousel gets its own
   **dedicated page** there (the kitchen-sink is currently single-page —
   see Setup for how the page is added).
2. **Fast loop = the `/tweak-component` cycle.** Iterate in code +
   kitchen-sink first (the fast visual signal); mirror settled values
   into Figma variables via the Desktop Bridge **last**, in one pass.
   Figma writes need a live bridge + human and aren't in git, so never
   redo them per-iteration.
3. **Styling API = Tabs-style contract.** BEM part classes
   (`.primitiv-carousel`, `__viewport`, `__slide`, `__prev`, `__next`,
   `__indicator-group`, `__indicator`, `__play-pause`) + a full set of
   `--primitiv-carousel-*` custom-property **knobs** (the primary
   theming API — modifiers re-point knobs, they don't restyle) + `cva`
   **modifier props** on Root/sub-components. State comes from the
   headless `data-*` hooks (`data-state`, `data-carousel-*`). Evolve to
   richer props/hooks only if a specific example proves the ergonomics
   demand it — start Tabs-shaped.
4. **Headless gaps filled reactively, via TDD, per example.** Known gaps
   vs. full-featured: **looping/infinite**, **vertical orientation** (no
   `data-orientation` is emitted today), **mouse-drag**, **explicit RTL
   tests**. Drive each of these into `packages/react` only when a chosen
   example needs it — red→green→refactor, 100% coverage, per the repo's
   strict TDD rules. No proactive parity pass.
5. **First example = basic responsive single-slide** (one slide per
   view, fills its container, viewport padding, prev/next + dots).
6. **Figma designs already exist — read them as the starting point.**
   The Figma **Carousel page** holds strong composition example frames
   built from established subcomponents. They are the reference for each
   example's look and a strong starting point — and they are **open to
   change during the cycle** as the code reveals better options. So each
   iteration begins by reading the relevant frame FROM Figma
   (`get_design_context` / `get_screenshot`), not by inventing a look.
   (No Carousel *component set* with variables exists yet — `ROADMAP.md`
   shows `Carousel | — |` — so any `--primitiv-carousel-*` variable
   model is still built via the bridge *after* the code-side values
   settle, in lockstep. The design intent is already there to read from;
   the token/variable model is what we add last.)
7. **Responsiveness is a hard requirement of every example.** The
   carousel adapts to its container by default, stretching to fill the
   space. Every example page must render multiple instances that vary
   viewport padding, indicator position, button position, and any other
   composable axis. Reach for container queries, CSS grid, logical
   properties, and RTL — the registry stylesheets today use logical
   properties pervasively but have **zero** container queries (a clean
   greenfield seam: re-point knobs inside `@container` rules, mirroring
   how size modifiers already re-point knobs).

## Architecture: the styling surface

Carousel is a **primitive-backed compound** (it wraps the headless
`Carousel`), so it follows the **generated** registry pattern that Tabs
and Accordion use — *not* the hand-authored prose pattern:

- `contract.json` (hand-authored) is the source of truth: `root`,
  `subcomponents` (each with `class`, `dataAttributes`, `modifiers`),
  top-level `modifiers` (e.g. a `size` group), and `customProperties`
  (every `--primitiv-carousel-*` knob + `defaultsTo`).
- `carousel.recipe.ts`, `carousel.tsx`, `styles.scss` are **generated
  from `contract.json`** by `primitiv-emit` (`emit_recipe` /
  `emit_wrapper` / the scss emitter) — the same path that produced
  `registry/components/tabs/tabs.tsx`. They carry the "Do not edit by
  hand… regenerate" header and are locked by the emit drift-guard tests.
- `styles.css` (hand-authored) is the default theme. **Seed it from the
  Carousel README's "Recommended CSS"** (`packages/react/src/Carousel/README.md`
  §Recommended CSS) — the viewport `display:flex; overflow-x:auto;
  scroll-snap-type; overscroll-behavior-x; scrollbar-width:none`, the
  slide `flex:0 0 100%; scroll-snap-align`, and the 44×44 dot hit-area
  recipe are all there. **The recommended CSS is a starting point, not a
  contract — adjust it whenever a better approach fits.** In particular,
  lean on the modern-CSS approach the [Blossom Carousel](https://blossom-carousel.com)
  demonstrates: **scroll-snap + `aspect-ratio` for slide sizing** (so a
  slide keeps its ratio while filling its share of the container),
  logical properties, and container-adaptive layout — rather than fixed
  pixel dimensions. Then **tokenize** every literal into a
  `--primitiv-carousel-*` knob backed by a design token, per the
  `registry-stylesheet-conventions` skill (no magic numbers, logical
  properties only, `@layer` order statement as the first line).
- The README's **JS-vs-CSS responsibility table** is the contract for
  what the stylesheet owns (slide layout/widths, gap, peek via viewport
  `padding-inline`, snap alignment CSS, crossfade off `data-state`) vs.
  what stays in JS (active page, boundary clamp, `snapAlign`).

## Setup (iteration 0 — do once, before example 1)

1. **Add a dedicated Carousel page to the kitchen-sink.** It is
   single-page today (`apps/kitchen-sink/src/App.tsx`, one scroll of
   `<Section>` blocks, no router). Introduce `react-router-dom` (already
   used in `apps/workbench`) with two routes: `/` (the existing kitchen
   sink) and `/carousel` (the dedicated Carousel gallery). Inside the
   Carousel page, use the **installed `Tabs` registry component** to tab
   between example recipes (dogfooding composition, mirroring the shape
   the workbench page used). Keep example CSS scoped to a page-specific
   class prefix to avoid the global-CSS-bundling leak.
2. **Create the registry surface** `registry/components/carousel/`:
   author `contract.json` (start minimal — Root + Viewport + Slide +
   prev/next + indicators, a `size` modifier, the first knobs) and
   `styles.css` (seeded + tokenized as above); generate `carousel.recipe.ts`,
   `carousel.tsx`, `styles.scss`; write `README.md`.
3. **Register it** (or the CLI can't serve it):
   `registry/registry.json` (add the object; `dependsOn.packages`
   includes `@primitiv-ui/react`), `crates/primitiv-cli/src/ports/registry.rs`
   (5 `registry_file!` entries), `crates/primitiv-cli/tests/cli.rs`
   (bump the `add --all` roster count + add a `.contains("carousel")`
   line), and the `primitiv-emit` drift-guard fixtures/goldens for the
   new component.
4. **Hand-sync into the kitchen-sink** exactly what `add` produces
   (copy `carousel.recipe.ts` + `contract.json` → `src/components/`,
   `styles.css` → `src/styles/primitiv/carousel/`, the tsx with a
   prepended `import "../styles/primitiv/carousel/styles.css";`, and the
   `export * from "./carousel"` barrel line in its sorted slot). Skip
   `primitiv.lock`.
5. **Create the development log** `docs/carousel-development-log.md`.

## The iteration loop (repeat per example)

1. **Pick an example** (human-approved) and **read its design frame from
   the Figma Carousel page** (`get_design_context` / `get_screenshot`)
   to ground the look before writing any CSS.
2. **Build it in the kitchen-sink** using the headless `Carousel` +
   evolving `registry/components/carousel/` styles. Add the example
   instance(s) to the dedicated Carousel page. **Every example ships
   multiple instances** varying viewport padding, indicator position,
   button position, and other composable axes — all responsive to their
   container by default.
3. **Fill headless gaps reactively.** If the example needs behaviour the
   primitive lacks (looping, vertical/`data-orientation`, mouse-drag,
   RTL), test-drive it into `packages/react` first (red→green→refactor,
   100% coverage), then consume it.
4. **Human QA.** The human runs a visual + interaction pass and feeds
   back. Iterate on the styling from that feedback (push each visual
   iteration if authorised; run the full gates once at the end).
5. **Mirror to Figma last.** Once the look is confirmed, pair the
   Desktop Bridge and write the settled values into the Figma variables
   (build the variable/component model greenfield, in lockstep).
6. **Update the log + docs.** Record what landed, decisions made, gaps
   discovered/filled, and what's next. Update the component README /
   `packages/react` docs for any consumer-facing change.

## Iteration 1 — Basic responsive single-slide

The foundation everything else reuses. Establishes the knob layer and
the default theme.

- **Layout:** one slide per view; viewport `flex` + `scroll-snap-type: x
  mandatory`; slide `flex: 0 0 100%; scroll-snap-align: start`. The root
  **fills its container** (`inline-size: 100%`), and the slide holds its
  shape with **`aspect-ratio`** (the Blossom approach) rather than a
  fixed block size — so it stays proportional as the container resizes.
- **Controls:** prev/next triggers + auto `Indicators` dots (the 44×44
  hit-area recipe, active dot via `[data-state="active"]`).
- **Knobs to introduce** (all `--primitiv-carousel-*`, backed by tokens):
  viewport `padding-inline` (peek/edge gutter), inter-slide `gap`,
  control size/offset, indicator dot size/gap/colour + active colour,
  focus-ring (reuse the shared `--primitiv-focus-ring*` system).
- **Instances on the page (responsive matrix):** default fill-container;
  with viewport padding (peek); indicators below vs. overlaid; prev/next
  outside vs. overlaid on the slide; a narrow container and a wide
  container side-by-side to prove container-adaptation. Add an RTL
  instance (via the existing `DirectionProvider`) to confirm logical
  properties mirror correctly — drive an explicit RTL test if a gap
  surfaces.
- **Definition of done:** registry `styles.css`/`.scss`/`contract.json`
  in sync; kitchen-sink hand-sync updated; component README updated if
  consumer-facing; log entry written; Figma variables mirrored once the
  human confirms the look.

## Critical files

- Headless primitive (reference, extend reactively):
  `packages/react/src/Carousel/{Carousel.tsx,types.ts,README.md}`,
  `packages/react/src/Carousel/__tests__/`.
- New registry surface: `registry/components/carousel/{contract.json,
  styles.css,styles.scss,carousel.recipe.ts,carousel.tsx,README.md}`.
- Registration: `registry/registry.json`,
  `crates/primitiv-cli/src/ports/registry.rs`,
  `crates/primitiv-cli/tests/cli.rs`, `primitiv-emit` goldens.
- Kitchen-sink: `apps/kitchen-sink/src/App.tsx` (+ new routing),
  `apps/kitchen-sink/src/components/{index.ts,carousel.*}`,
  `apps/kitchen-sink/src/styles/primitiv/carousel/styles.css`, a new
  `apps/kitchen-sink/src/pages/Carousel*` view.
- Pattern references: `registry/components/tabs/` (compound analog),
  `apps/kitchen-sink/src/components/tabs.tsx`.
- Log: `docs/carousel-development-log.md`.
- Skills to load: `/tweak-component`, `new-registry-component`,
  `registry-stylesheet-conventions`, `figma-bridge-token-sync`,
  `react-test-conventions`, `sandbox-gotchas`.

## Verification

- **Fast visual loop:** the human runs the kitchen-sink dev server and
  eyeballs the dedicated Carousel page (the sandbox has no
  `node_modules` for it, so the human verifies live — push each
  authorised iteration).
- **Gates (run once at the end of each iteration):**
  `cargo test -p primitiv-cli -p primitiv-emit` (registry roster +
  emit drift), `node scripts/check-registry-types.mjs` (wrapper
  type-check), and `pnpm --filter @primitiv-ui/react exec vitest run
  src/Carousel` for any headless behaviour driven that iteration
  (with `qa:units` for full coverage when a gap was filled).
- **CSS/SCSS/contract parity** stays in sync (drift-guarded).
- **Interaction QA (human):** keyboard (Arrow/Home/End on viewport),
  swipe/scroll-snap, prev/next boundary clamp, indicator jump, RTL
  mirroring, container-resize adaptation.
