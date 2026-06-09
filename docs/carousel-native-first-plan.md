# Carousel: native-first transitions + Blossom example parity

## Context

The headless `Carousel` (`packages/react/src/Carousel`) keeps a strong
compound architecture (9 sub-components, Radix-style) but its transition
engine has been a persistent source of frustration in the workbench. The
root cause: a heavy JS layer that *fights* native scrolling — programmatic
`scrollTo` computed from `getBoundingClientRect`, bidirectional
`scrollsnapchange`/IntersectionObserver sync, and especially the
**clone-based loop machinery** (leading/trailing clones, `pendingWrapRef`
wrap direction, a silent snap-back that toggles `scroll-snap-type`). That
clone path is the most entangled, bug-prone code and is what keeps the
transitions feeling broken.

Blossom Carousel (blossom-carousel.com) demonstrates a cleaner model we
want to borrow from: **native-first** — let CSS own the visual movement
(`scroll-snap`, CSS Grid, `gap`, `aspect-ratio`, `scroll-padding`) and let
JS only *reflect* active state and *delegate* programmatic navigation to
the browser. Blossom also marks infinite/cyclical looping as
**experimental** — i.e. out of scope for us right now.

**Decisions already taken with the user:**
1. Keep the compound architecture unchanged (no public sub-component changes).
2. Native-first refactor of the transition engine.
3. **Remove the loop feature** (clones + wrap machinery) for now.
4. Use Blossom's installable Claude skill as **reference only** — no
   `@blossom-carousel/*` runtime dependency; we keep our own component.

**Intended outcome:** a simpler, reliable scroll-driven Carousel whose
nine workbench examples (basic → advanced, excluding experimental loop) all
behave correctly, each backed by green tests at 100% coverage.

---

## Step 0 — Install Blossom's Claude skill (reference only)

Run `npx skills add https://www.blossom-carousel.com` to pull Blossom's
agent skill for CSS/example pattern reference while building. If the
environment network policy blocks it, fall back to the patterns already
captured below — no blocker. **Do not** add any `@blossom-carousel/*`
package to `package.json`.

---

## Engine refactor (strict TDD, one commit per cycle)

Sequencing principle: **remove loop first** (largest, most self-contained
surface), **then** swap the scroll model, so the second phase edits a much
smaller viewport hook and the suite stays green between every commit.

### Phase A — remove loop / clone machinery

- **A1 — delete the loop spec.** Delete `Carousel.loop-animation.test.tsx`
  wholesale (all 19 cases are loop-only; nothing else references clones).
  Test-only commit: "remove loop-animation suite ahead of loop removal".
- **A2 — drop the `loop` prop + boundary semantics.** Edit the four
  boundary tests that pass `loop` (`prev-next`, `slides-per-page`,
  `auto-play` drop their `loop=true` blocks; `slides-per-move`,
  `keyboard-navigation` just reword titles — bodies already pass no loop).
  Then in production: `useCarouselRoot.ts` — remove `loop` from props,
  drop the `loop ||` disjuncts in `canGoNext`/`canGoPrevious` (→ plain
  `currentPage > 0` / `< totalPages - 1`), delete the wrap arming in
  `next`/`previous` and `pendingWrapRef`, switch modular wrap arithmetic to
  clamped increments. `Carousel.tsx` — drop `loop` from `CarouselRoot`.
  `types.ts` — remove `loop?` from `CarouselRootProps` and
  `loop`/`pendingWrapRef` from `CarouselContextValue`. README — strip all
  loop/clone prose + the `loop` row; JSDoc on `next`/`previous` drops
  "wraps with loop".
- **A3 — delete clone injection.** Add one guard test in
  `basic-rendering.test.tsx` ("renders slides in source order, no
  `[data-carousel-slide-clone]`, slide count unchanged"). Then in
  `Carousel.tsx` delete `CAROUSEL_SLIDE_TYPE`, `CarouselCloneSlide`,
  `isSlideElement`, `injectLoopClones`, the brand assignment on
  `CarouselSlide`, now-unused imports, and simplify `CarouselViewport` to
  render `children` directly. Update `CarouselViewport` JSDoc.

### Phase B — native-first scroll model in `useCarouselViewport.ts`

Adopt `element.scrollIntoView({ behavior, inline, block })` over the manual
`scrollTo` + rect math. `inline:"start"` maps to `snapAlign:"start"`,
`inline:"center"` to `snapAlign:"center"`; always pass `block:"nearest"` to
avoid vertical page jumps. This deletes the whole rect-math block and
asserts *intent* (we delegated to the browser) rather than re-derived
coordinates.

- **B1 — polyfill `scrollIntoView` for jsdom.** jsdom does **not** implement
  `scrollIntoView` and it is **not** currently polyfilled (the
  `react-test-conventions` skill note is stale — `src/test/scrollPolyfill.ts`
  only installs `scrollTo`). Add a no-op `Element.prototype.scrollIntoView`
  to `scrollPolyfill.ts` *before* any test calls it. Infra commit; suite
  stays green.
- **B2 — swap State→Scroll rect math for `scrollIntoView`.** Rewrite
  `scroll-sync.test.tsx` (spy the target slide's `scrollIntoView`, assert
  `{ behavior, inline, block }`, not numeric `left`; drop `mockSlideOffsets`);
  update `reduced-motion.test.tsx` (assert `behavior:"instant"`),
  `refresh-progress.test.tsx`, and the "no scroll after user swipe" test in
  `scroll-snap-change.test.tsx` to spy `scrollIntoView`. Production: in the
  State→Scroll effect keep the `transition!=="slide"` early return, the
  `firstSlideKey` lookup, and the `isUserScrollRef` skip; replace the rect
  block + `wrapDirection`/clone-target branch + clone re-anchor with a single
  `targetEl.scrollIntoView({ behavior: scrollBehavior, inline: snapAlign ===
  "center" ? "center" : "start", block: "nearest" })`. Rewrite the hook's
  State→scroll JSDoc.
- **B3 — simplify the `isProgrammaticScrollRef` guard.** Its only surviving
  job is debouncing the IntersectionObserver. The IO in-flight regression
  test (`intersection-observer.test.tsx`) is the spec and must stay green.
  Reduce `clearFlag` to the `cleared` idempotency guard + set-false (no
  clone re-anchor, no `scroll-snap-type` toggle). Keep `isUserScrollRef`
  (still suppresses the redundant `scrollIntoView` after a user swipe).
  Delete `pendingWrapRef` usage. Update the `isProgrammaticScrollRef` JSDoc
  in `types.ts`.
- **B4 — simplify the `scrollsnapchange` handler.** Replace the entire
  `slideIndex < 0` clone re-anchor block with `if (slideIndex < 0) return;`,
  keep the `floor(slideIndex / effectiveSlidesPerMove)` page derivation,
  drop now-unused context reads (`totalPages`, `pendingWrapRef`,
  `snapAlign` if unused here). The 6 `scroll-snap-change.test.tsx` cases
  stay green. Rewrite the Scroll→state JSDoc.

`transition:"none"` is untouched throughout — it early-returns in all three
viewport effects and never used loop; `transition-modes.test.tsx` is the
guardrail and must stay green untouched.

---

## Workbench example rebuild (`apps/workbench/src/pages/CarouselExample`)

No example uses `loop`, so none needs a prop change — only CSS cleanup and
parity fixes. **Global-SCSS gotcha:** keep every selector nested under the
example's root class; never hoist a bare `[data-...]` selector.

- **Delete dead `&[data-carousel-slide-clone]` blocks** from the six scroll
  SCSS files (`_singleSlideScroll`, `_multiSlideScroll`,
  `_multiStepSlideScroll`, `_peek`, `_variableSizes`, `_programmatic`).
- **Restore `aspect-ratio`** on the two crossfade grids
  (`_multiSlideCrossfade.scss`, `_multiStepSlideCrossfade.scss`) so the grid
  has intrinsic height and partial pages stop collapsing (the documented
  breakage). Confirm the real asset ratio before un-commenting `1120/959`.
- **Verify each example against the Blossom recipe** (scroll variants:
  `display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:var(--gap)`
  + slides `flex:0 0 <w>; scroll-snap-align:start|center; scroll-snap-stop:always`;
  multi-per-page width `flex:0 0 calc((100% - (N-1)*var(--gap))/N)`; peek
  adds `scroll-padding-inline`/`padding-inline` + center snap; crossfade uses
  `transition="none"` + grid overlay with `opacity` toggled by
  `[data-state="active"]` and a `prefers-reduced-motion` guard).

The nine existing tabs (SingleSlide/MultiSlide/MultiStep × Scroll/Crossfade,
Peek, VariableSizes, Programmatic) already map to Blossom's basic→advanced
set. After cleanup, audit the Blossom list against the tabs; only add a new
example folder + tab + `examples/index.ts` export if a genuine gap exists
(e.g. an autoplay or centered/cover-flow demo). The `/carousel` route in
`App.tsx` already exists — no router change unless adding a wholly new page.
Each example edit is its own small SCSS-only commit.

---

## Critical files

- `packages/react/src/Carousel/hooks/useCarouselViewport.ts` — heaviest change
- `packages/react/src/Carousel/hooks/useCarouselRoot.ts` — loop/wrap removal
- `packages/react/src/Carousel/Carousel.tsx` — clone machinery removal
- `packages/react/src/Carousel/types.ts` — `loop`/`pendingWrapRef` removal, JSDoc
- `packages/react/src/test/scrollPolyfill.ts` — add `scrollIntoView` no-op
- `packages/react/src/Carousel/__tests__/*` — delete loop spec, update scroll/boundary specs
- `packages/react/src/Carousel/README.md` + `packages/react/README.md` table — docs
- `apps/workbench/src/pages/CarouselExample/examples/*` — SCSS cleanup + crossfade fix

## Verification

- **Per cycle:** `pnpm --filter @primitiv-ui/react exec vitest run src/Carousel`.
- **End of Phase A and Phase B:** `pnpm --filter @primitiv-ui/react qa:units`
  (full suite + 100% coverage). Watch coverage on the `snapAlign==="center"`
  inline branch, the `isUserScrollRef` skip, the `scrollBehavior==="instant"`
  branch, and the `firstSlideKey` undefined guard — add micro-tests if v8
  reports a gap after the large clone deletion.
- **Workbench:** the sandbox may not run the dev server (`sandbox-gotchas`);
  if so, visual parity is verified locally by the user via `pnpm run dev` on
  `/carousel`. Confirm each tab scrolls/snaps cleanly, crossfade pages keep
  their height, and Peek centers correctly with `scroll-padding`.

## Open questions to resolve during implementation

- **snapAlign center vs `inline:"center"`** under `scroll-padding` (Peek): if
  `scrollIntoView` centering drifts, rely on CSS `scroll-snap-align:center`
  to do the final correction (the native-first bet), or keep `scrollTo` math
  for the center case only. Loop removal is independent of this choice.
- **Crossfade `aspect-ratio`** may over-constrain variable-height images —
  confirm the real asset ratio before committing.
