---
name: carousel-infinite-loop-engine
description: Hard-won gotchas and debugging methodology for the Carousel's infinite-loop transform engine (`packages/react/src/Carousel/hooks/useCarouselLoop.ts`, RFC 0018) — the clone-strip architecture, the windowing sweep, the goTo/next direction split, the drag-fling/positioning-effect collision, and the rAF-coalesced drag repaint. TRIGGER when working in `useCarouselLoop.ts`, debugging a loop="infinite" navigation/drag/fling feel or visibility bug, or extending the clone-strip/windowing/rebase mechanics. SKIP for the native-scroll (loop="wrap"/"none") path (`useCarouselViewport.ts`), non-carousel work, and building a new example variant (see `carousel-variant`).
---

# Carousel infinite-loop engine — gotchas and debugging methodology

Five real bugs were found and fixed in the infinite-loop engine across one
extended session (2026-07-18), each traced to a genuine mechanism, not a
typo — the full narrative (with hand-derived numbers, RED/GREEN
transcripts) is in `docs/carousel-development-log.md`. This skill distills
the *reusable* traps and the *methodology* that found them, so the next
session debugging this engine doesn't have to re-derive either from
scratch.

## The architecture in one paragraph

A `data-carousel-track` strip is laid out as
`[head clones][real slides][tail clones]` — one full period of `aria-hidden`,
`inert` clones each side, so every seam is already-painted DOM. Navigation
only ever translates the **whole track** via a JS-computed `transform`; no
slide moves relative to it. A glide that carries past a real slide onto a
clone is invisible-if-correct: the clone is pixel-identical to the real
slide it stands in for, so a **rebase** (`normalizeOffset` + an instant,
untransitioned repaint) can silently shift the whole strip by one period
with nothing visibly changing. Every bug below is a variation on "the
rebase, or the windowing that protects it, fired at the wrong moment."

## Five traps, each a real bug this session

1. **A `MutationObserver` watching a slide for consumer content changes will
   thrash on the engine's own writes.** `paint()` writes `visibility` and
   `--slide-progress` onto every real slide's inline `style` on every
   navigation, drag `pointermove`, and glide rAF tick. A naive observer
   comparing before/after `style` values can't tell that apart from a
   consumer's own style change (e.g. a gradient swap) — both mutate the same
   attribute. Fix pattern: strip the engine-owned declarations out of both
   sides before comparing (`styleWithoutEngineProps` in the source) rather
   than filtering by attribute *name* alone (name-only filtering can't
   distinguish two different reasons to touch the *same* attribute).

2. **Windowing needs a swept *range*, not the current point.** `paint()`'s
   visibility window is `[from, offset] ± margin`. A call site that passes
   the *same* value for both (`paint(x, x, g, false)`) gives every entering
   slide zero lookahead — fine while `x` changes by a few px a frame, broken
   the one frame it jumps discontinuously (a drag's `normalizeOffset` wrap
   at the seam moves the raw number by a whole `trackLength` in one event).
   Fix pattern: track the value *before* this update separately from the
   value *after*, and pass both as `from`/`offset` even for a "single frame"
   call — a click-glide already does this by construction (it sweeps
   `[from, target]`); a drag's per-event repaint has to do it deliberately.

3. **`shortestStep` (the ring's short way) is right for `next()`/`previous()`
   and wrong for a direct jump.** A relative step should always wrap the
   short way (continue forward off the last slide, never rewind the whole
   strip) — but `goTo()`/`scrollToIndex()` (indicators, thumbnails, the
   imperative API) land on a *specific* page, where the short way can visibly
   take the wrong direction (picking the last indicator from the first
   silently steps *backward* one slide instead of visibly traveling forward
   through the whole strip). These need different math
   (`currentPageOffset - logical`, no modulo, vs. `shortestStep`'s ring-aware
   version) and the engine can't tell them apart from the resulting
   `currentPageOffset` value alone — it needs an explicit one-shot signal
   (`directJumpRef`, set by `goTo()`, cleared by `next()`/`previous()`,
   consumed once by the positioning effect).

4. **Two call paths into the same glide is a collision waiting for the
   trackLength boundary.** A fling's `onPointerUp` drives the track directly
   (`glideTo()`) *and* calls `goTo()` to sync `currentPage` — but that
   `goTo()` is a state update, and the *same* "drive the track to the active
   page" positioning effect that serves every click reacts to it too. That
   effect always rebases first. For an ordinary fling the rebase is a no-op
   (the target's already in `[0, trackLength)`); for one crossing the seam,
   the target is usually *exactly* one `trackLength` past a real position,
   so the rebase fires for real — instantly, with no transition — and
   clobbers the just-started animated glide before the browser paints a
   single frame of it. The fix is a one-shot "I already handled this"
   flag (`dragHandledPositionRef`), not a change to either glide's own math.
   **General lesson:** any handler that both drives a glide directly *and*
   triggers a re-render of the effect that also drives glides needs this
   kind of flag — the effect can't safely assume its own rebase is a no-op
   just because clicks always found it so.

5. **A CSS grid's implicit row/column track sizes to its *content*, not the
   container's own fixed box — even when the container has a definite
   `aspect-ratio`.** The thumbnail frame is `display: inline-grid` (for the
   dot variant's centred `::before`) with no `grid-template-rows`. A
   percentage `block-size: 100%` on a grid item resolves against its *row
   track's* size; with no explicit template, that track sizes to the
   item's own content — for a real `<img>`, its natural aspect ratio, not
   the frame's `aspect-ratio` box. The frame's own border-box stayed
   correct; only the *image inside it* silently tracked its own proportions.
   Fix pattern: take the child out of grid flow entirely
   (`position: absolute; inset: 0`, against the frame's own
   `position: relative`) instead of relying on percentage sizing — the same
   technique the dot's own `::before` already uses one rule below, for the
   same reason.

## Debugging methodology that actually found these

- **When reasoning stalls after two wrong guesses, instrument and drive a
  deterministic jsdom test — don't guess a third time.** The rebase-collision
  bug (trap 4) was found by adding temporary `console.log`s to `paint()`,
  `rebase()`, and the positioning effect, then driving a hand-computed
  drag+release through the existing test harness. The trace showed the
  *exact* sequence (an animated `PAINT`, immediately followed by an instant
  `REBASE`, immediately followed by a zero-distance animated `PAINT`) that
  no amount of re-reading the source surfaced. Revert the `console.log`s
  before committing — they're a scratch tool, not part of the fix.
- **jsdom shows the *target*, not the *interpolated* value.** `el.style.transform`
  reflects whatever was last assigned, synchronously — jsdom runs no
  transitions. To sample an in-flight CSS transition's actual visual
  progress, you need a real browser: `getComputedStyle(el).transform`
  in a real Chromium (via the harness below), polled over time.
- **The real-browser verification harness** (used for every fix this
  session, since `apps/kitchen-sink` can't build in this sandbox — see
  `sandbox-gotchas`): esbuild-bundle the *real* `CarouselBuilder.tsx`
  (`entryPoints: ['entry-builder.tsx']`, aliasing `react`/`react-dom` to
  `packages/react/node_modules/*`, `@primitiv-ui/react` to
  `packages/react/src/index.ts`, `.jpg` to `dataurl`, `prism-react-renderer`
  to a tiny local stub), serve it with
  `python3 -m http.server` (background), and drive it with `playwright-core`
  against `/opt/pw-browsers/chromium`. Dispatch real `PointerEvent`s with
  `pointerType: "touch"` via `page.evaluate` for drag/swipe scenarios —
  Playwright's own mouse APIs don't produce touch events. The server dies
  between shell turns in this sandbox; restart it (`nohup ... &`) before
  each script rather than assuming it's still up.
- **A test that survives the bug it's meant to catch is worse than no test —
  confirm RED against the specific pre-fix commit, not just "it currently
  passes."** One test this session (`clone.getAttribute("style")` compared
  to itself) passed against *both* the fixed and the unfixed code, because
  it compared a detached DOM node to its own later self rather than checking
  whether a rebuild had replaced it with a new node. Fixed by asserting node
  *identity* (`toBe`) at the query site instead of an attribute value. When
  a fix touches multiple commits (this session's did, repeatedly), stash or
  `git show <commit>:<path>` the specific pre-fix version and re-run the new
  test against *that*, not just "before my latest edit."
- **`slidesPerPage > 1` changes `align`, not just `effectiveSlidesPerMove`.**
  `align = (trackSize - pageSpan) / 2` for a centred multi-slide page can go
  *negative* once `pageSpan` (`stride * slidesPerPage`) exceeds the mocked
  single-slide track width in a test — every transform assertion in a
  multi-slide test carries that constant offset. Hand-computed expected
  values that ignore it will fail with a suspiciously-exact-looking wrong
  number (the align delta) — recompute `align` explicitly rather than
  reusing a single-slide test's numbers.
