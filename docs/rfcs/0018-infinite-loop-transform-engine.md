# RFC 0018 — Infinite carousel loop via a JS transform engine

> **Status:** Landed, **clone-strip revision (2026-07-17).** The original §3 "no
> clones" per-slide `wrapShift` fill still flashed on iOS at the seam (device QA of
> plain single-slide cell 7): moving individual slides discontinuously is exactly
> what iOS Safari can't pre-rasterise. Revised — and human-approved — to the
> transform + **contiguous clone strip** model (as Embla/Swiper): `[a period of
> clones] [real slides] [a period of clones]`, translate the **whole track** only,
> and re-base by one period on settle (pixel-identical → invisible). This keeps the
> JS-transform decision (no native snap) but reverses "no clones"; it structurally
> removes the seam flash rather than mitigating it. `wrapShift` is deleted. See the
> 2026-07-17 `docs/carousel-development-log.md` entry. Real-device QA on iOS Safari
> is the remaining verification.
> **Author:** simonrevill, with architectural review
> **Date:** 2026-07-16
> **Seeds from:** the carousel loop-variant session — three iOS-specific fixes to
> the scroll-snap infinite loop (teleport-then-glide, hold-snap-through-glide,
> pre-teleport reflush) all failed real-iPhone QA. See
> `docs/carousel-development-log.md` (the "iPhone" / "clone buffer" / "hold
> scroll-snap" entries).
> **Relates to:** the `carousel-variant` skill and the loop work on
> `packages/react/src/Carousel`. `none` and `wrap` loop modes are **untouched**.

---

## 0. Summary

Reimplement **`loop="infinite"` only** on a JS-driven **transform track** with a
JS momentum model, replacing the native-scroll-snap + clone-buffer + `scrollend`
recentre. `none` and `wrap` keep their pure scroll-snap implementation. The
public API (`loop="infinite"`, all other props, the context, controls,
indicators, autoplay, progress) is unchanged.

## 1. Why

Native CSS scroll-snap cannot loop seamlessly on iOS Safari:

- **Button wrap rewinds** — programmatic teleports don't reliably apply
  `scroll-snap-type: none` before the scroll write, so iOS re-snaps and the glide
  runs the whole track.
- **Fast-flick jank / "second time around" stall** — the clone buffer + the
  `scrollend`-driven recentre can't reset position fast enough under iOS
  momentum; once you've travelled ~a buffer's worth, the next wrap runs the long
  way. Deepening the buffer only moved "first lap" to "second lap".
- **Unautomatable** — Playwright's `webkit` is desktop Linux WebKitGTK, *not* iOS
  Safari, and no engine simulates touch inertia, so CI passed while the iPhone
  failed. We cannot iterate this class of bug against the toolchain we have.

This is the documented limitation of pure scroll-driven looping. Every library
that ships seamless infinite (Embla, Swiper, Keen) drives a transform track for
exactly this reason: when *you* own the position, you can reposition invisibly at
the seam and run momentum yourself — no native snap to fight, iOS included.

## 2. Scope

**In:** `loop="infinite"` reimplemented on a transform track — seamless wrap both
directions, prev/next/`goTo`/keyboard, autoplay across the seam, indicators,
progress, `onPageChange`, drag/swipe with JS inertia, wheel, RTL, vertical,
`prefers-reduced-motion`.

**Untouched:** `loop="none"` and `loop="wrap"` (native scroll-snap), the public
Carousel API, and all non-infinite features.

**Deferred (open decision — see §7):** `slidesPerPage > 1`, `peek`, and
`viewport-padding` *under the transform engine*. Proposal: land single-slide
infinite first; add multi-slide/peek as a follow-up increment.

## 3. Model

### DOM / CSS (infinite mode only)
- Viewport becomes `overflow: hidden` (no native scroll).
- Slides are wrapped in a `__track` flex row; the engine sets
  `transform: translate3d(...)` on the track.
- **No clones.** Infinite is achieved by giving each slide a per-slide wrap shift
  of `±(trackLength)` derived from the current offset, so a slide leaving one
  edge reappears at the other with no seam and no jump (Embla-style "loop
  points"). The track offset itself stays continuous.
- Registry `styles.css` / `.scss` gain an infinite-scoped block
  (`[data-loop="infinite"]`): `overflow: hidden`, the track, and the translate
  var. The drift guard keeps css/scss in lockstep.

### Interaction (all JS → iOS-reliable)
- **Drag/swipe:** `pointerdown` captures, `pointermove` moves the offset (1:1,
  optional edge-resistance-free since it's infinite), tracking velocity.
- **Release:** a `requestAnimationFrame` friction-decay animation carries the
  momentum, then eases to the nearest slide boundary (settle-snap).
- **Buttons / keyboard / `goTo` / autoplay:** an eased rAF tween animates the
  offset to the target boundary, always **wrapping the short way** (the reason
  buttons exist here — no full-track rewind is representable).
- **Wheel/trackpad:** `deltaX`/`deltaY` → offset.
- **Reduced motion:** offset is set instantly (no momentum, no tween).

### State
- `currentPage` derives from the settled boundary (offset → nearest slide index).
  It feeds the **existing** context untouched — indicators, progress, `aria-live`,
  `onPageChange`. `next`/`previous`/`goTo` drive the engine instead of `scrollTo`.

### A11y
- Slides stay in DOM order; the active slide is focusable; aria roles unchanged.
  Keyboard paging routes through the same engine as the buttons.

## 4. What is removed (infinite path only)
- The clone buffer (`makeClones`, `BUFFER_PERIODS`, `data-clone-of`), the
  `scrollend` recentre, and teleport-then-glide — they existed *only* for the
  scroll-snap infinite loop. `wrap`/`none` never used them.

## 5. TDD strategy
- **Deterministic engine unit tests:** mock `requestAnimationFrame` +
  `performance.now` (fake clock) and slide geometry; drive pointer events and
  button/`goTo` calls; assert offset, `currentPage`, wrap-by-short-way, momentum
  settle-snap, and reduced-motion instant. 100% lines/branches/functions.
- **Real-browser Playwright (chromium + webkit):** seamless wrap both ways settles
  on the right slide; drag inertia settles to a boundary; there is no "clone" to
  strand on. (Still cannot validate iOS *momentum feel* — real-device stays the
  final QA — but the engine removes the native-scroll-snap dependency that caused
  every iOS failure, so what passes here is far more predictive than before.)

## 6. Rollout (increment plan)
1. Track + transform rendering for infinite (static offset) + engine scaffold — RED.
2. Button/`goTo`/keyboard tween + wrap-the-short-way + `currentPage` sync.
3. Pointer drag + release momentum + settle-snap.
4. Wheel; RTL; vertical.
5. Autoplay across the seam; progress; reduced motion.
6. Remove the dead clone-buffer/recentre code from the infinite path.
7. *(Follow-up — landed)* multi-slide, peek, padding under the engine: the engine
   reads the stride sign as an axis `dir` (RTL mirrors), cancels the track's `base`
   inset (peek/padding stays centred), and glides to the page's leading slide
   index `currentPageOffset` (multi-slide advances a whole page; the inter-slide
   gap returns via a `data-slides-per-page` track hook, one-up stays gapless).

Each step is one red→green(-refactor) cycle with its docs (JSDoc, README, the
components table already lists Carousel). The workbench/kitchen-sink loop cells
already exist and become the transform engine's QA surface.

## 7. Decisions needed before coding
1. **v1 scope:** single-slide infinite first (multi-slide + peek as a follow-up
   increment), or must v1 cover `slidesPerPage > 1` and `peek` too?
2. **Surface:** keep it all under the existing `loop="infinite"` (recommended — no
   API change), confirmed?
3. **Removing the scroll-snap infinite code** once the engine lands — OK to delete
   the clone buffer + recentre (they're infinite-only), keeping `wrap`/`none` as
   the scroll-snap path?

## 8. Risks
- **Headless purity:** the engine sets more inline style (a `translate`) than the
  scroll-snap path did. It's still *behaviour*, not visual styling — consumer CSS
  still owns looks — but it is a step further from "the browser scrolls it".
- **Effort:** multi-cycle; larger than any single loop increment so far.
- **Momentum feel** is still only fully judgeable on a real device; this RFC makes
  it *tunable in JS* (friction/deceleration constants) instead of at the mercy of
  the OS, which is the point.
