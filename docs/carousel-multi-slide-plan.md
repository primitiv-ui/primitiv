# Carousel multi-slide plan — `slidesPerPage` / `slidesPerMove`

> **Durable working doc** for the multi-slide correctness pass (carousel
> iteration 8+). Companion to `carousel-development-plan.md` /
> `carousel-development-log.md`. The goal the human set: *"There is no room for
> error or a flaky carousel in Primitiv."* The kitchen-sink Multi-slide page
> becomes the **golden reference** proving every edge case. Read this first
> before resuming the multi-slide work.

> **Status (2026-07-09): landed, awaiting human QA.** All three layers fixed —
> headless hardening (commit `8b30295`), the `styleProps` emitter capability +
> registry wiring, and the auto `<CarouselIndicators>` + golden edge-case grid at
> `/carousel/multi`. Decisions D1–D3 below are LOCKED. See
> `carousel-development-log.md` iteration 8. Remaining: human QA + Figma lockstep.

## TL;DR — three defects stacked on top of each other

1. **Headless page-model bugs** (confirmed by the human from earlier workbench
   testing). The `slidesPerPage` / `slidesPerMove` model is mostly built and
   tested, but numeric `slidesPerMove` has correctness gaps (orphaned tail
   slides, an inconsistent swipe→page sync, no input guards).
2. **Registry wrapper swallows `slidesPerPage`.** The generated `Carousel`
   wrapper destructures `slidesPerPage` and uses it **only** for the CSS
   modifier class — it is never forwarded to the headless `Carousel.Root`. So
   the headless still thinks `slidesPerPage === 1`: it renders one indicator
   **per slide**, clamps Next to the last *slide* (not the last *page*), and
   advances one slide at a time. `slidesPerMove` isn't exposed at all.
3. **Registry surface has no auto `Indicators` part.** The headless
   `Carousel.Indicators` renders exactly `totalPages` dots, but the registry
   only exposes `IndicatorGroup` + `Indicator` (manual). Every example therefore
   maps one `Indicator` per slide by hand — so even once (1) and (2) are fixed,
   the dot count is still hardcoded wrong.

All three must land together, or the dot count stays wrong.

## The headless page model (as it exists today)

`packages/react/src/Carousel/hooks/useCarouselRoot.ts` + `useCarouselSlide.ts` +
`useCarouselViewport.ts`. Props: `slidesPerPage = 1`, `slidesPerMove = "auto"`.

```
effectiveSlidesPerMove = slidesPerMove === "auto" ? slidesPerPage : slidesPerMove

totalPages =
  total === 0            ? 0
  : total <= perPage     ? 1
  : move === "auto"      ? ceil(total / perPage)                       // paged
  :                        floor((total - perPage) / effMove) + 1      // windowed

currentPage  = clamp(rawPage, 0, totalPages - 1)   // uncontrolled; controlled throws
pageOffset   = currentPage * effectiveSlidesPerMove
slide.active = pageOffset <= index < pageOffset + perPage
scrollTarget = slideKeys[currentPage * effectiveSlidesPerMove]        // scrollIntoView
IO page sync = floor(visibleSlideIndex / perPage)                     // on user swipe
```

Two intended modes:
- **`"auto"` (paged)** — non-overlapping page groups, partial last page allowed,
  Next/Prev move a full page. `ceil(total/perPage)` pages.
- **numeric (windowed)** — overlapping windows, always full, slide by `move`
  slides per click. `floor((total-perPage)/move)+1` pages.

## Edge-case audit

### Truth table — `"auto"` mode (move = perPage), pages as `[slide indices]`

| perPage | total | totalPages | pages | notes |
|--:|--:|--:|---|---|
| 2 | 1 | 1 | `[0]` | fewer than a page → 1 page, no nav |
| 2 | 2 | 1 | `[0,1]` | exactly one page |
| 2 | 3 | 2 | `[0,1] [2]` | **partial last page** (1 slide) |
| 2 | 4 | 2 | `[0,1] [2,3]` | clean |
| 2 | 5 | 3 | `[0,1] [2,3] [4]` | partial last page |
| 2 | 6 | 3 | `[0,1] [2,3] [4,5]` | clean |
| 3 | 3 | 1 | `[0,1,2]` | exactly one page |
| 3 | 4 | 2 | `[0,1,2] [3]` | partial last page |
| 3 | 7 | 3 | `[0,1,2] [3,4,5] [6]` | partial last page |
| 4 | 3 | 1 | `[0,1,2]` | fewer than a page |

### Truth table — numeric `slidesPerMove`, pages as `[slide indices]`

| perPage | move | total | totalPages (current formula) | pages | verdict |
|--:|--:|--:|--:|---|---|
| 2 | 1 | 6 | 5 | `[0,1][1,2][2,3][3,4][4,5]` | ✅ the human's example — 5 dots |
| 3 | 1 | 5 | 3 | `[0,1,2][1,2,3][2,3,4]` | ✅ full windows |
| 3 | 2 | 7 | 3 | `[0,1,2][2,3,4][4,5,6]` | ✅ exact, all reachable |
| 3 | 2 | 5 | 2 | `[0,1,2][2,3,4]` | ✅ all reachable |
| 3 | 2 | **6** | **2** | `[0,1,2][2,3,4]` | ❌ **slide 5 orphaned** — inexact tail |
| 2 | 3 | 6 | 2 | `[0,1][3,4]` | ❌ slide 2 & 5 orphaned; gap between windows |
| 2 | 5 | 6 | 1 | `[0,1]` | ❌ move > reachable → most slides orphaned |

### Confirmed / suspected headless defects

- **B1 — orphaned tail (inexact numeric move).** When `(total − perPage)` is not
  a multiple of `move`, the floor formula drops the final partial step, so the
  last slides are unreachable by Prev/Next/Indicators. **Fix candidate:**
  end-align — `totalPages = ceil((total − perPage) / move) + 1`, and **clamp the
  last page's offset** to `total − perPage` (in `useCarouselSlide` *and* the
  viewport scroll target) so the final window is `[total−perPage … total−1]`.
  This is the Embla/Splide behaviour (the last page always snaps to the end).
- **B2 — swipe→page sync inconsistent in windowed mode.** The IntersectionObserver
  maps a visible slide to `floor(slideIndex / perPage)`, but the windowed model's
  page→offset is `page * move`. When `move ≠ perPage` a manual swipe can set
  `currentPage` to a value whose `pageOffset` doesn't match where the user landed,
  so active states / the next programmatic scroll jump. **Fix candidate:** derive
  the page from the offset model — `clamp(round(firstVisibleIndex / move), 0,
  totalPages−1)` (and honour the B1 end-clamp).
- **B3 — no input guards.** `slidesPerPage = 0` → `ceil(total/0) = Infinity`;
  negative / `NaN` / fractional counts are undefined behaviour. **Fix candidate:**
  coerce to `max(1, floor(n))` for `perPage`, `max(1, floor(n))` for a numeric
  `move`, at the hook boundary. (Whether to also clamp `move ≤ perPage` is a
  decision — see D3.)
- **B4 — gap between windows when `move > perPage`.** `perPage=2, move=3` skips
  slide 2 entirely. Arguably legal (that's what the consumer asked for), but for
  a "no flaky" guarantee we may clamp `move` to `≤ perPage`. See D3.

None of B1–B4 has a failing test yet — each is a **new red test** to drive.

## Decisions — LOCKED (2026-07-08, human)

- **D1 = Numeric passthrough props.** `slidesPerPage={n}` / `slidesPerMove={n}`
  are real numbers forwarded to the headless; the wrapper also drives the
  `--primitiv-carousel-slides-per-page` CSS knob. Build the `primitiv-emit`
  forward-and-knob capability (TDD). Drop the capped `slidesPerPage` string
  modifier.
- **D2 = default `slidesPerMove` stays `"auto"`** (move a full page). Examples
  show move=1 explicitly.
- **D3 = harden all three.** End-align the last page so every slide is reachable;
  clamp numeric `move ≤ perPage` (no gap-skipping); guard `perPage` / numeric
  `move` to `≥ 1` (integer, NaN→1).
  - **Correction (QA round 1):** end-align applies to **both** modes, not just
    windowed. A partial last page in *auto* mode can't start-snap either (its
    leading slide has nothing after it), which desynced the active page against
    the scroll (examples 4 & 12). The offset model is now unified —
    `offset(i) = min(i·step, maxOffset)`, `totalPages = ceil(maxOffset/step)+1`,
    `pageForSlideIndex` = nearest-offset scan — with the page count unchanged.

## Decisions to lock before coding (superseded — see LOCKED above)

- **D1 — registry API shape.** Expose `slidesPerPage` / `slidesPerMove` as real
  **numeric passthrough props** forwarded to the headless (arbitrary counts,
  matches the headless numeric API), with the wrapper also setting the
  `--primitiv-carousel-slides-per-page` CSS knob — **vs** keeping them as capped
  string modifiers (`"1".."4"`). Recommendation: **numeric passthrough** (the
  page model is fundamentally numeric; capping at 4 in the type surface is what
  produced the split brain). Cost: a small `primitiv-emit` capability — "a prop
  that both forwards to the primitive and drives a CSS custom property" (TDD in
  the emitter), since the wrapper is generated + drift-guarded.
- **D2 — default `slidesPerMove`.** `"auto"` (move a full page — conventional
  paged gallery) **vs** `1` (move one slide — sliding window). The human's
  example reasoned about move=1. Recommendation: keep the headless default
  `"auto"` (page-at-a-time is the least surprising for dot-per-page), and show
  move=1 explicitly in the examples — but this is the human's call.
- **D3 — numeric-move tail + bounds.** (a) End-align the last window so all
  slides are always reachable (fixes B1)? Recommendation **yes**. (b) Clamp
  `move ≤ perPage` to forbid inter-window gaps (B4)? Recommendation **yes**
  (a gap-skipping carousel is exactly the "flaky" the human wants gone). (c)
  Guard `perPage`/`move` to `≥ 1` (B3)? Recommendation **yes**.

## Registry surface changes (once D1–D3 are set)

- **Forward the page-model props.** `Carousel` wrapper passes `slidesPerPage` /
  `slidesPerMove` to `Carousel.Root` **and** sets the CSS knob. Drop the
  `slidesPerPage` string modifier (D1) — or teach the emitter the
  forward-and-knob capability (D1).
- **Add the auto `Indicators` part.** New `subcomponent` (`component:
  "Indicators"`) → generated `<CarouselIndicators>` renders `totalPages` dots.
  Examples use it instead of hand-mapping `Indicator` per slide.
- Regenerate recipe/tsx/scss (drift-guarded); hand-sync kitchen-sink; README +
  contract updated; keep `--primitiv-carousel-slides-per-page` documented for
  arbitrary CSS-only counts.

## Golden example matrix — the Multi-slide kitchen-sink page

Human's spec: a **3-column grid**, wide-desktop (no responsive concern), **small**
instances, each with a **numbered title above** and a **short description below**.
Cover, at minimum:

1. `perPage 2`, `auto`, 6 slides — clean paged (3 dots, move by 2).
2. `perPage 2`, `move 1`, 6 slides — windowed (5 dots) ← the reported case.
3. `perPage 2`, `auto`, 5 slides — **partial last page** (3 dots, last shows 1).
4. `perPage 3`, `auto`, 7 slides — partial last page (3 dots).
5. `perPage 3`, `move 1`, 5 slides — full windows (3 dots).
6. `perPage 3`, `move 2`, 6 slides — **inexact tail** (proves B1 end-align).
7. `perPage 2`, 1 slide — degenerate: 1 page, no nav, Next/Prev disabled.
8. `perPage 4`, 3 slides — fewer than a page: 1 page, no nav.
9. `perPage 2`, 2 slides — exactly one page.
10. `perPage 2`, `auto`, 6 + `peek="sm"` — composes with peek.
11. `perPage 3`, `auto`, 7, RTL — mirrors.
12. `perPage 2`, `auto`, vertical, 6 — multi-slide on the block axis.

Each cell asserts (by eye) the **dot count**, the **disabled ends**, and that
**every slide is reachable**. Titles like *"6 — perPage 3, move 2, 6 slides
(inexact tail)"* so QA can tick them off.

## Implementation order (strict TDD)

1. **Headless first.** Red→green each of B1–B4 in
   `Carousel.slides-per-move.test.tsx` / a new bounds test; 100%
   lines/branches/functions. Update JSDoc + component README (page-model
   section, the end-align + bounds rules).
2. **Emitter capability (D1)** — TDD the forward-and-knob (or the chosen shape)
   in `primitiv-emit`.
3. **Registry surface** — contract (forwarded props + `Indicators` part),
   regenerate, drift-green, README/contract, kitchen-sink hand-sync. Keep the
   dev-alias so the unpublished headless fixes are live in the kitchen-sink.
4. **Golden examples** — the 3-col grid above, numbered + described.
5. **Gates** — `cargo test -p primitiv-emit -p primitiv-cli`,
   `check-registry-types.mjs`, `pnpm --filter @primitiv-ui/react exec vitest run
   src/Carousel` (+ `qa:units` for coverage on the headless changes).
6. Push to `main`; STOP for QA. Figma lockstep stays after sign-off.
