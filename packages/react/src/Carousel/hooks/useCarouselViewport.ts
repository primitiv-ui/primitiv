import {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useCarouselContext } from "./useCarouselContext";

// A pointer movement below this many pixels (along the scroll axis) is
// still a click, not a drag — so a link/button inside a slide keeps
// working under the pointer that just tapped it.
const DRAG_THRESHOLD_PX = 3;

// Amplifies the pointer delta applied to scrollLeft/scrollTop during a
// drag. A slide can be many hundreds of pixels wide, and a literal 1:1
// ratio means dragging the slide's full width to move through it once —
// far more physical movement than the gesture should cost. 2x means a
// drag needs to cover only half the on-screen distance to produce the
// same scroll, without introducing momentum (the multiplier only scales
// the *tracked* delta; there's still no motion after release).
const DRAG_SENSITIVITY = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Owns the Viewport-side scroll-state sync — bidirectional.
 *
 * **State → scroll.** When `currentPage` flips for any reason
 * (NextTrigger, Indicator click, autoplay tick, imperative goTo), the
 * effect locates the first slide of the target page via the published
 * `slidesRef`, reads its `getBoundingClientRect` relative to the
 * viewport, and calls `scrollTo` so the visual surface tracks React
 * state. The current `scrollLeft` is included in the target so the
 * calculation is correct mid-scroll. The run also asserts
 * `isProgrammaticScrollRef` so the IntersectionObserver fallback
 * doesn't treat the in-flight animation as a user scroll and undo the
 * page change; the flag clears on `scrollend` (with a timeout
 * fallback for environments that don't fire it).
 *
 * **Scroll → state.** When the user swipes the viewport, the browser
 * fires `scrollsnapchange` with the new snap target. The handler
 * looks up which slide that target is, computes
 * `floor(slideIndex / slidesPerPage)`, and calls `goTo` on the new
 * page (skipping when the page is unchanged so consumers don't see
 * spurious onPageChange callbacks, and bailing when the snap target
 * isn't one of our registered slides). An `IntersectionObserver`
 * provides the same page-drive for browsers without `scrollsnapchange`,
 * but stands down when the event is supported (it is authoritative);
 * the observer still always feeds `isInView`.
 *
 * **Keyboard → state.** Returns an `onKeyDown` handler that wires the
 * WAI-ARIA Carousel pattern arrow keys (`ArrowRight` / `ArrowLeft` for
 * next / previous) plus `Home` / `End` (first / last) onto the same
 * imperative API the trigger buttons call, so smooth scroll matches
 * the click path. The handler only fires when the Viewport itself is
 * the focus target — focus inside a slide keeps its native arrow-key
 * semantics — and respects `canGoNext` / `canGoPrevious` so it clamps
 * at the ends.
 */
export function useCarouselViewport() {
  const {
    slidesRef,
    slideKeys,
    slidesPerPage,
    effectiveSlidesPerMove,
    maxOffset,
    currentPageOffset,
    pageForSlideIndex,
    totalPages,
    currentPage,
    goTo,
    next,
    previous,
    canGoNext,
    canGoPrevious,
    transition,
    snapAlign,
    orientation,
    loop,
    allowMouseDrag,
    onDragStatusChange,
    onOverscrollStatusChange,
    inViewThreshold,
    refreshTick,
    visibleSlideIndicesRef,
    setSlideInView,
    isProgrammaticScrollRef,
    instantScrollRef,
    wrapDirectionRef,
    setDragging,
    setOverscrolling,
    setScrollProgress,
    setSlideProgress,
  } = useCarouselContext();
  // The observer's own `threshold` option accepts a number or number[]
  // as-is; for the "in view" cutoff a single number is used directly, and
  // an array uses its highest value (the strictest crossing) — matching
  // the single-boolean semantics `isInView`/the IO page-drive fallback need.
  const inViewCutoff = Array.isArray(inViewThreshold)
    ? Math.max(...inViewThreshold)
    : inViewThreshold;
  const internalRef = useRef<HTMLDivElement>(null);
  // Set to true by the scrollsnapchange handler and the IntersectionObserver
  // callback before they call goTo(), so the scroll effect knows the page
  // change originated from a user scroll (CSS snap already positioned the
  // viewport) and must not call scrollTo() again.
  const isUserScrollRef = useRef(false);
  // Tracks whether the infinite loop has done its one-shot initial
  // positioning. The first infinite scroll jumps *instantly* to the real
  // (middle) copy — the viewport starts scrolled to the leading clone, which
  // is an identical copy of slide 0, so a smooth scroll to the real slide 0
  // would animate one period between two identical views (a pointless slide
  // on load). An instant jump makes it invisible.
  const hasPositionedRef = useRef(false);

  // Callback ref so the consumer can compose their own ref with ours
  // via `composeRefs` later (cycle 22 introduces asChild). For now,
  // it just stashes the node.
  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    internalRef.current = node;
  }, []);

  // Mouse click-and-drag scrolling. Opt-in via `allowMouseDrag` (default
  // false) — an unconditionally-on drag could conflict with a consumer's own
  // drag-sensitive slide content (a nested carousel, a draggable card, a
  // canvas). When enabled, tracks the pointer at DRAG_SENSITIVITY× (no
  // momentum — the multiplier only scales the tracked delta, motion still
  // stops dead on release) by writing scrollLeft/scrollTop directly during
  // the drag; release lets the
  // existing scroll-snap-type settle to the nearest slide, which the
  // scrollsnapchange sync above already picks up for free — no extra "scroll
  // → state" wiring needed here. `dragStateRef.current.dragging` only flips
  // true once the pointer clears DRAG_THRESHOLD_PX, so a plain click (no
  // capture, no preventDefault) still reaches a link/button under the
  // pointer untouched. The delta is always computed against the *start*
  // scroll position (not incrementally from the last move), and
  // scrollLeft/scrollTop is direction-mode-agnostic — dragging right always
  // reveals content that was to the left, in both LTR and the
  // now-standardized negative-scrollLeft RTL convention — so no RTL
  // special-casing is needed.
  const dragStateRef = useRef<{
    pointerId: number;
    startClient: number;
    startScroll: number;
    dragging: boolean;
    // Set while the drag is pushing past a boundary the carousel has
    // already reached — see the overscroll detection in onPointerMove.
    overscrollEdge: "start" | "end" | null;
  } | null>(null);
  // Browsers still synthesize a click at the release point after a drag
  // unless it's suppressed — set once a drag crosses the threshold, consumed
  // (and cleared) by the next click, so a link/button under the release
  // point doesn't fire.
  const suppressNextClickRef = useRef(false);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        !allowMouseDrag ||
        event.pointerType !== "mouse" ||
        transition !== "slide"
      ) {
        return;
      }
      // Guaranteed populated — this handler only ever fires as a React
      // event on the very element viewportRef attached to.
      const viewport = internalRef.current!;
      const vertical = orientation === "vertical";
      dragStateRef.current = {
        pointerId: event.pointerId,
        startClient: vertical ? event.clientY : event.clientX,
        startScroll: vertical ? viewport.scrollTop : viewport.scrollLeft,
        dragging: false,
        overscrollEdge: null,
      };
    },
    [allowMouseDrag, orientation, transition],
  );

  // A real <img>/<a> inside a slide is natively draggable, and starting a
  // drag over one fires the browser's own HTML5 drag-and-drop (the
  // semi-transparent ghost that follows the cursor) — which visually
  // competes with the custom pointer-based drag-to-scroll below. Only
  // suppressed when allowMouseDrag is opted into; a consumer who hasn't
  // enabled our drag-to-scroll keeps native image/link dragging untouched.
  const onDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!allowMouseDrag) return;
      event.preventDefault();
    },
    [allowMouseDrag],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      // Guaranteed populated (see onPointerDown).
      const viewport = internalRef.current!;
      const vertical = orientation === "vertical";
      const clientPos = vertical ? event.clientY : event.clientX;
      const delta = clientPos - drag.startClient;

      if (!drag.dragging) {
        if (Math.abs(delta) < DRAG_THRESHOLD_PX) return;
        drag.dragging = true;
        suppressNextClickRef.current = true;
        viewport.setPointerCapture?.(drag.pointerId);
        viewport.setAttribute("data-dragging", "");
        setDragging(true);
        onDragStatusChange?.({
          type: "dragging.start",
          page: currentPage,
          isDragging: true,
        });
      } else {
        onDragStatusChange?.({
          type: "dragging",
          page: currentPage,
          isDragging: true,
        });
      }

      // Overscroll: dragging further past a boundary the carousel has
      // already reached. Positive delta drags toward the start edge,
      // negative delta toward the end edge — see the scrollLeft/scrollTop
      // assignment below (the same convention the regular drag scroll
      // uses). Only meaningful once the drag threshold is crossed
      // (drag.dragging, asserted above).
      const overscrollEdge =
        delta > 0 && !canGoPrevious
          ? "start"
          : delta < 0 && !canGoNext
            ? "end"
            : null;
      if (overscrollEdge) {
        const amount = Math.abs(delta) * DRAG_SENSITIVITY;
        const type = drag.overscrollEdge ? "overscroll" : "overscroll.start";
        drag.overscrollEdge = overscrollEdge;
        setOverscrolling(true);
        viewport.setAttribute("data-overscroll", overscrollEdge);
        onOverscrollStatusChange?.({
          type,
          edge: overscrollEdge,
          source: "drag",
          amount,
          page: currentPage,
        });
      } else if (drag.overscrollEdge) {
        const endedEdge = drag.overscrollEdge;
        drag.overscrollEdge = null;
        setOverscrolling(false);
        viewport.removeAttribute("data-overscroll");
        onOverscrollStatusChange?.({
          type: "overscroll.end",
          edge: endedEdge,
          source: "drag",
          amount: 0,
          page: currentPage,
        });
      }

      event.preventDefault();
      const nextScroll = drag.startScroll - delta * DRAG_SENSITIVITY;
      if (vertical) viewport.scrollTop = nextScroll;
      else viewport.scrollLeft = nextScroll;
    },
    [
      orientation,
      currentPage,
      onDragStatusChange,
      setDragging,
      canGoNext,
      canGoPrevious,
      onOverscrollStatusChange,
      setOverscrolling,
    ],
  );

  const endDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.dragging) {
      internalRef.current?.releasePointerCapture?.(drag.pointerId);
      internalRef.current?.removeAttribute("data-dragging");
      setDragging(false);
      onDragStatusChange?.({
        type: "dragging.end",
        page: currentPage,
        isDragging: false,
      });
      if (drag.overscrollEdge) {
        internalRef.current?.removeAttribute("data-overscroll");
        setOverscrolling(false);
        onOverscrollStatusChange?.({
          type: "overscroll.end",
          edge: drag.overscrollEdge,
          source: "drag",
          amount: 0,
          page: currentPage,
        });
      }
    }
    dragStateRef.current = null;
  }, [
    currentPage,
    onDragStatusChange,
    setDragging,
    onOverscrollStatusChange,
    setOverscrolling,
  ]);

  const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  // Read prefers-reduced-motion once on mount; choose scrollTo
  // behavior accordingly so we don't fight the OS-level setting.
  const scrollBehavior = useMemo<ScrollBehavior>(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    [],
  );

  useEffect(() => {
    // transition="none" hands the visual to consumer CSS; we don't
    // touch viewport.scrollTo at all in that mode.
    if (transition !== "slide") return;
    const firstSlideKey = slideKeys[currentPageOffset];
    // No slides registered yet, or page out of range: nothing to scroll to.
    if (!firstSlideKey) return;

    // Both viewport ref and the slide element are guaranteed populated
    // here — the effect runs post-commit (after callback refs fire) and
    // any key in slideKeys was just registered into slidesRef in
    // lockstep by useCarouselRoot.registerSlide.
    // A user swipe via CSS scroll-snap has already positioned the viewport;
    // calling scrollTo on top would start a second animation and cause jank.
    if (isUserScrollRef.current) {
      isUserScrollRef.current = false;
      return;
    }

    const viewport = internalRef.current!;

    // Mark the scroll as programmatic so the IntersectionObserver
    // doesn't treat the in-flight animation as a user scroll and undo
    // the page change. next() / previous() also set this — re-asserting
    // here covers indicator-driven goTo and the initial scroll on
    // mount, neither of which goes through next() / previous().
    isProgrammaticScrollRef.current = true;

    // Scroll the *viewport itself* — never `targetEl.scrollIntoView()`, which
    // walks every scrollable ancestor (including the page/window) and so scrolls
    // the whole document when the carousel is off-screen. We read the target
    // slide's `getBoundingClientRect` relative to the viewport and add the delta
    // to the current scroll offset (so the maths is correct mid-scroll), then let
    // the consumer's `scroll-snap-align` make the final correction — we never
    // fight the snap engine. The scroll axis follows `orientation`; the cross axis
    // is untouched, so the viewport never drifts on the other axis. `start` aligns
    // the slide's leading edge to the viewport's; `center` centres it; `end`
    // aligns its trailing edge.
    // Under infinite, a wrap (last↔first) glides *forward* into the trailing
    // clone (or *backward* into the leading clone) instead of rewinding across
    // the whole track — the clone is the adjacent copy, so the scroll is one
    // step, and the scrollend recentre then teleports to the real slide. The
    // direction is a one-shot from next()/previous(), consumed here.
    const wrapDirection = wrapDirectionRef.current;
    wrapDirectionRef.current = null;
    const gliding = loop === "infinite" && wrapDirection !== null;
    let targetEl = slidesRef.current!.get(firstSlideKey)!;
    if (gliding) {
      // Two clones per real slide (leading + trailing, in DOM order); glide
      // forward to the trailing one, backward to the leading one.
      const clones = viewport.querySelectorAll<HTMLDivElement>(
        `[data-clone-of="${currentPageOffset}"]`,
      );
      targetEl = (
        wrapDirection === "forward" ? clones[clones.length - 1] : clones[0]
      )!;
    }
    const vertical = orientation === "vertical";
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const currentScroll = vertical ? viewport.scrollTop : viewport.scrollLeft;
    const delta = vertical
      ? targetRect.top - viewportRect.top
      : targetRect.left - viewportRect.left;
    // The target slide's own snapAlign (Carousel.Slide's `snapAlign` prop,
    // already merged with the root default) is read off the DOM rather than
    // context, since only the slide component knows whether it set a
    // per-slide override. `Carousel.Slide` always publishes data-snap-align
    // on a valid snap-start slide — the only kind `firstSlideKey` ever is
    // (see useCarouselSlide's isSnapStart gate) — so this is never
    // undefined in practice; no fallback needed. `snapAlign` (the root
    // value) stays a dependency below purely so this effect re-runs and
    // re-reads the DOM when it changes without an accompanying page change.
    const effectiveSnapAlign = targetEl.dataset.snapAlign;
    // For center/end, the leftover space must be measured against the whole
    // *page* (every slide sharing this page, edge to edge) rather than just
    // the leading slide's own box — a multi-slide page's other members would
    // otherwise be excluded from the alignment math entirely, undershooting
    // the scroll and leaving the page's trailing slide(s) clipped off-screen.
    // `start` doesn't depend on this (its alignOffset is always 0), but
    // computing it unconditionally costs nothing and keeps the code path
    // uniform. The last member's index is clamped to the actual slide count
    // (slidesPerPage can exceed how many slides really exist).
    const lastMemberIndex = Math.min(
      currentPageOffset + slidesPerPage - 1,
      slideKeys.length - 1,
    );
    // When gliding into a clone the "page" is that single clone (infinite is
    // single-slide-scoped), so measure the span against the clone itself —
    // the real last-member slide is a full period away and would corrupt the
    // center/end alignment.
    const lastMemberEl = gliding
      ? targetEl
      : slidesRef.current!.get(slideKeys[lastMemberIndex])!;
    const lastMemberRect = lastMemberEl.getBoundingClientRect();
    // Computed as left/top + width/height, not the rect's own .right/.bottom
    // — real DOMRects derive those the same way, but keeping the maths
    // explicit here matches the plain-object rect fixtures used in tests.
    const pageSpan = vertical
      ? lastMemberRect.top + lastMemberRect.height - targetRect.top
      : lastMemberRect.left + lastMemberRect.width - targetRect.left;
    const leftoverSpace = vertical
      ? viewport.clientHeight - pageSpan
      : viewport.clientWidth - pageSpan;
    const alignOffset =
      effectiveSnapAlign === "center"
        ? leftoverSpace / 2
        : effectiveSnapAlign === "end"
          ? leftoverSpace
          : 0;
    const position = currentScroll + delta - alignOffset;
    // instantScrollRef is a one-shot override set by this specific next() /
    // previous() / goTo() call — consumed (and cleared) immediately so it
    // never leaks into a later page change that didn't request it (e.g. a
    // user swipe or a subsequent plain next()). The infinite loop's *first*
    // positioning is also instant (see hasPositionedRef) so it lands on the
    // middle copy without a pointless one-period slide on load.
    const infiniteInit = loop === "infinite" && !hasPositionedRef.current;
    if (loop === "infinite") hasPositionedRef.current = true;
    const behavior =
      instantScrollRef.current || infiniteInit ? "instant" : scrollBehavior;
    instantScrollRef.current = false;
    viewport.scrollTo(
      vertical ? { top: position, behavior } : { left: position, behavior },
    );

    // Clear the programmatic-scroll guard once the animation settles.
    // `scrollend` is the reliable signal in real browsers; the setTimeout
    // is a fallback for environments (jsdom, older Safari) that don't fire
    // it. The timeout is longer than any typical smooth-scroll duration so
    // real-browser IO entries that fire mid-animation are still suppressed.
    // Re-clearing the flag is harmless, so no idempotency guard is needed.
    const clearFlag = () => {
      isProgrammaticScrollRef.current = false;
    };
    viewport.addEventListener("scrollend", clearFlag, { once: true });
    const timeoutId = setTimeout(() => {
      viewport.removeEventListener("scrollend", clearFlag);
      clearFlag();
    }, 600);
    return () => {
      clearTimeout(timeoutId);
      viewport.removeEventListener("scrollend", clearFlag);
    };
  }, [
    transition,
    snapAlign,
    orientation,
    loop,
    currentPageOffset,
    slidesPerPage,
    slideKeys,
    slidesRef,
    refreshTick,
    scrollBehavior,
  ]);

  // Keeps every page's leading slide `scroll-margin` extended out to its
  // page's actual last member, so a user's own swipe/wheel/touch — settled
  // entirely by the browser's native scroll-snap, never by the scrollTo
  // effect above — also spans the whole page for center/end alignment
  // instead of just the leading slide's own box (the same fix applied to
  // the programmatic scroll, just expressed as a native snap-area
  // extension rather than a scrollTo offset). A single slide-per-page
  // carousel needs no extension at all, so this is a no-op there. Runs for
  // every page up front (not just the current one), since a fast native
  // fling under `mandatory` snapping can settle on a page the effect above
  // never programmatically targeted.
  useEffect(() => {
    if (transition !== "slide" || slidesPerPage <= 1) return;
    // Guaranteed populated — this effect only runs post-commit, and
    // slidesRef.current is a plain useRef(new Map()) in useCarouselRoot,
    // never null.
    const viewport = internalRef.current!;
    const vertical = orientation === "vertical";

    const recomputeScrollMargins = () => {
      const slides = slidesRef.current!;
      for (let page = 0; page < totalPages; page++) {
        const offset = Math.min(page * effectiveSlidesPerMove, maxOffset);
        const lastIndex = Math.min(
          offset + slidesPerPage - 1,
          slideKeys.length - 1,
        );
        // Guaranteed populated — any key in slideKeys was just registered
        // into slidesRef in lockstep by useCarouselRoot.registerSlide (see
        // the scroll-position effect above).
        const leadingEl = slides.get(slideKeys[offset])!;
        const lastEl = slides.get(slideKeys[lastIndex])!;
        const leadingRect = leadingEl.getBoundingClientRect();
        const lastRect = lastEl.getBoundingClientRect();
        // Computed as left/top + width/height (not .right/.bottom) to match
        // the plain-object rect fixtures used in tests — real DOMRects
        // derive those the same way.
        const extra = vertical
          ? lastRect.top + lastRect.height - (leadingRect.top + leadingRect.height)
          : lastRect.left + lastRect.width - (leadingRect.left + leadingRect.width);
        leadingEl.style.scrollMarginInlineEnd = vertical ? "" : `${extra}px`;
        leadingEl.style.scrollMarginBlockEnd = vertical ? `${extra}px` : "";
      }
    };

    recomputeScrollMargins();
    // Equal-share slide sizes derive from the viewport's own width/height, so
    // the px extension above must stay current across resizes, not just
    // page/slide-count changes (which the effect already re-runs for).
    const resizeObserver = new ResizeObserver(recomputeScrollMargins);
    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, [
    transition,
    orientation,
    slidesPerPage,
    effectiveSlidesPerMove,
    maxOffset,
    totalPages,
    slideKeys,
    slidesRef,
  ]);

  // Continuous scroll-progress signal — a live 0..1 global value plus a
  // per-slide -1..1 center-distance, both mirrored onto CSS custom
  // properties for real-time visual consumption without a React
  // re-render. Unconditional (unlike the scroll-margin effect above,
  // which is meaningless outside `transition: "slide"`) — progress
  // should degrade gracefully to near-zero in `fade` mode rather than
  // not exist at all.
  useEffect(() => {
    const viewport = internalRef.current!;
    const vertical = orientation === "vertical";
    // Coalesces any number of scroll/resize signals within one animation
    // frame into a single recompute — a native `scroll` event can fire many
    // times per frame during momentum scrolling, and each recompute reads
    // getBoundingClientRect() per slide (a forced-layout read), so batching
    // avoids a textbook scroll-jank anti-pattern. `pendingFrame` is a plain
    // closure variable, not a ref — it never needs to outlive this specific
    // effect instance.
    let pendingFrame: number | null = null;

    const recomputeProgress = () => {
      const maxScroll = vertical
        ? viewport.scrollHeight - viewport.clientHeight
        : viewport.scrollWidth - viewport.clientWidth;
      const scrollPos = vertical ? viewport.scrollTop : viewport.scrollLeft;
      // Math.abs, not the raw signed value — modern browsers standardize
      // RTL scrollLeft on the "negative" convention (0 at the start, down
      // to -maxScroll at the end), so this makes "distance travelled from
      // the start" monotonic in both directions with no dir/
      // getComputedStyle read, mirroring why the drag handler above needs
      // no RTL special-casing either.
      const scrollProgress =
        maxScroll > 0 ? clamp(Math.abs(scrollPos) / maxScroll, 0, 1) : 0;
      setScrollProgress(scrollProgress);
      viewport.style.setProperty("--carousel-progress", String(scrollProgress));

      const viewportRect = viewport.getBoundingClientRect();
      const viewportHalfSize = vertical
        ? viewportRect.height / 2
        : viewportRect.width / 2;
      const viewportCenter = vertical
        ? viewportRect.top + viewportHalfSize
        : viewportRect.left + viewportHalfSize;
      const slides = slidesRef.current!;
      slideKeys.forEach((key, index) => {
        const slideEl = slides.get(key);
        // A slide can unmount in the same commit that re-runs this effect
        // (orientation is one of its other dependencies) — the removed
        // slide's ref callback deletes it from slidesRef synchronously
        // during the mutation phase, while this effect's own closure still
        // has the pre-drop slideKeys (its slideKeys update hasn't flushed
        // a render yet). Skip the orphaned key; the next slideKeys change
        // re-runs this effect against the settled set. Same race as the
        // IntersectionObserver effect above.
        if (!slideEl) return;
        const slideRect = slideEl.getBoundingClientRect();
        const slideCenter = vertical
          ? slideRect.top + slideRect.height / 2
          : slideRect.left + slideRect.width / 2;
        const slideProgress =
          viewportHalfSize > 0
            ? clamp((slideCenter - viewportCenter) / viewportHalfSize, -1, 1)
            : 0;
        setSlideProgress(index, slideProgress);
        slideEl.style.setProperty("--slide-progress", String(slideProgress));
      });
    };

    const scheduleRecompute = () => {
      if (pendingFrame !== null) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null;
        recomputeProgress();
      });
    };

    recomputeProgress();
    viewport.addEventListener("scroll", scheduleRecompute, { passive: true });
    const resizeObserver = new ResizeObserver(scheduleRecompute);
    resizeObserver.observe(viewport);
    return () => {
      viewport.removeEventListener("scroll", scheduleRecompute);
      resizeObserver.disconnect();
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    };
  }, [orientation, slideKeys, slidesRef, setScrollProgress, setSlideProgress]);

  // Horizontal mouse-wheel translation. A physical scroll wheel (vertical
  // notches, deltaY only) already natively scrolls a vertically-scrollable
  // container, so orientation="vertical" needs nothing here. But browsers
  // only auto-translate a plain vertical wheel to horizontal scroll when
  // Shift is held, so a horizontal (the default) carousel gets no scroll at
  // all from a physical wheel without this. Registered via addEventListener
  // (not the React onWheel prop) with { passive: false } — React attaches
  // wheel listeners as passive by default, which would silently no-op
  // preventDefault() and let the page scroll vertically at the same time.
  // Deliberately stands down whenever deltaX is non-negligible: a trackpad
  // or Magic Mouse horizontal swipe already produces real deltaX and already
  // scrolls a horizontal viewport natively via the same mechanism as touch —
  // this must never fight that, only fill the gap a plain vertical wheel
  // leaves. deltaY is normalized from line/page units to pixels so a
  // physical wheel's larger, fewer DOM_DELTA_LINE ticks feel proportional to
  // a trackpad's many small DOM_DELTA_PIXEL ones.
  useEffect(() => {
    if (transition !== "slide" || orientation === "vertical") return;
    const viewport = internalRef.current!;

    const handler = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > 0.5) return;
      let deltaY = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaY *= 16;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaY *= viewport.clientWidth;
      }

      // Overscroll: a wheel notch pushing forward/backward while already
      // at that boundary. A single discrete tick — no meaningful distance
      // to report, unlike the continuous drag case.
      if (deltaY > 0 && !canGoNext) {
        onOverscrollStatusChange?.({
          type: "overscroll",
          edge: "end",
          source: "wheel",
          amount: 0,
          page: currentPage,
        });
      } else if (deltaY < 0 && !canGoPrevious) {
        onOverscrollStatusChange?.({
          type: "overscroll",
          edge: "start",
          source: "wheel",
          amount: 0,
          page: currentPage,
        });
      }

      event.preventDefault();
      viewport.scrollLeft += deltaY;
    };

    viewport.addEventListener("wheel", handler, { passive: false });
    return () => viewport.removeEventListener("wheel", handler);
  }, [
    transition,
    orientation,
    canGoNext,
    canGoPrevious,
    currentPage,
    onOverscrollStatusChange,
  ]);

  // User-driven scroll → state. Listen for scrollsnapchange and update
  // currentPage from the snapped slide's index. The viewport ref is
  // guaranteed populated post-commit (callback ref runs first).
  useEffect(() => {
    if (transition !== "slide") return;
    const viewport = internalRef.current!;

    const handler = (event: Event) => {
      // The snapped slide is reported on the axis the viewport scrolls:
      // snapTargetBlock for a vertical carousel, snapTargetInline otherwise.
      const snapEvent = event as Event & {
        snapTargetInline?: Element;
        snapTargetBlock?: Element;
      };
      const target =
        orientation === "vertical"
          ? snapEvent.snapTargetBlock
          : snapEvent.snapTargetInline;

      // findIndex returns -1 when the snap target isn't one of our
      // registered slides — e.g. a consumer-wrapped element inside the
      // viewport. Ignore those; only registered slides drive the page.
      let slideIndex = slideKeys.findIndex(
        (key) => slidesRef.current!.get(key) === target,
      );
      // A clone in the infinite loop's edge buffer isn't registered, so it
      // won't be found above — resolve it to the real index it mirrors
      // (`data-clone-of`) so swiping into the buffer still tracks the right
      // page; the scrollend recentre then teleports the pixels back.
      if (slideIndex < 0) {
        const cloneOf = (target as HTMLElement | undefined)?.dataset?.cloneOf;
        if (cloneOf !== undefined) slideIndex = Number(cloneOf);
      }
      if (slideIndex < 0) return;

      const targetPage = pageForSlideIndex(slideIndex);
      if (targetPage !== currentPage) {
        isUserScrollRef.current = true;
        goTo(targetPage);
      }
    };

    viewport.addEventListener("scrollsnapchange", handler);
    return () => viewport.removeEventListener("scrollsnapchange", handler);
  }, [
    transition,
    orientation,
    slideKeys,
    slidesRef,
    pageForSlideIndex,
    currentPage,
    goTo,
  ]);

  // Infinite-loop recentre. After the scroll settles (`scrollend`) on a clone
  // in the edge buffer, instantly teleport to the real slide it mirrors — an
  // identical copy exactly one period away — so a native swipe/drag/wheel
  // across the seam reads as a continuous glide with no rewind. Only wired for
  // loop === "infinite" (the clone buffer exists only then). `scroll-snap-type`
  // is suppressed for the instant jump and restored on the next frame so the
  // snap engine doesn't re-animate on top of it. The geometry is pixel-exact
  // only in a real browser (jsdom reports zeroed layout), so this is
  // control-flow-tested here and verified for feel on a real device.
  useEffect(() => {
    if (transition !== "slide" || loop !== "infinite") return;
    const viewport = internalRef.current!;
    const vertical = orientation === "vertical";
    const edge = (el: HTMLElement) =>
      vertical
        ? el.getBoundingClientRect().top
        : el.getBoundingClientRect().left;

    const recentre = () => {
      const slides =
        viewport.querySelectorAll<HTMLElement>("[data-carousel-slide]");
      if (slides.length === 0) return;
      const viewportStart = edge(viewport);
      // The settled snap is the slide (real or clone) whose leading edge is
      // nearest the viewport's leading edge.
      const nearest = Array.from(slides).reduce((best, el) =>
        Math.abs(edge(el) - viewportStart) <
        Math.abs(edge(best) - viewportStart)
          ? el
          : best,
      );
      // A real slide is already home; only a clone needs recentring.
      const cloneOf = nearest.dataset.cloneOf;
      if (cloneOf === undefined) return;
      // Teleport by the clone→real offset so the real slide lands exactly
      // where the clone was — same view, so the jump is invisible. The clone
      // always mirrors a valid registered index (both come from the same
      // children), so the lookup is guaranteed.
      const realEl = slidesRef.current!.get(slideKeys[Number(cloneOf)])!;
      const delta = edge(realEl) - edge(nearest);
      const prevSnapType = viewport.style.scrollSnapType;
      viewport.style.scrollSnapType = "none";
      if (vertical) viewport.scrollTop += delta;
      else viewport.scrollLeft += delta;
      requestAnimationFrame(() => {
        viewport.style.scrollSnapType = prevSnapType;
      });
    };

    viewport.addEventListener("scrollend", recentre);
    return () => viewport.removeEventListener("scrollend", recentre);
  }, [transition, loop, orientation, slideKeys, slidesRef]);

  // IntersectionObserver fallback for browsers without scrollsnapchange,
  // and the source of truth for isInView() on the imperative API. The
  // observer fires whenever a slide crosses the inViewThreshold visibility
  // threshold (0.6 by default); the lowest-index visible slide derives the
  // active page.
  useEffect(() => {
    if (transition !== "slide") return;

    // When the browser fires scrollsnapchange (Chrome 129+), that event is
    // the authoritative source of the active page — snapTargetInline is the
    // precisely-snapped slide. The observer below then only feeds isInView.
    // Its lowest-index-visible heuristic is a coarse page fallback for
    // browsers without the event, and would mis-track a centre-aligned
    // carousel that shows several slides at once (it follows the leftmost
    // visible slide, not the centred one), so it must not drive the page
    // when the event is available.
    const supportsSnapEvents = "onscrollsnapchange" in window;

    const observer = new IntersectionObserver(
      (entries) => {
        // The live observer only observes elements still present in
        // slidesRef (the setup loop skips orphaned keys), and a stale
        // observer is disconnected on cleanup when the effect re-runs, so
        // by the time a callback fires both lookups (slideKeys.findIndex →
        // registered key, and the slidesRef get → element) resolve.
        for (const entry of entries) {
          const idx = slideKeys.findIndex(
            (key) => slidesRef.current!.get(key) === entry.target,
          );
          setSlideInView(
            idx,
            entry.isIntersecting && entry.intersectionRatio >= inViewCutoff,
          );
        }

        // isInView is updated above regardless; only the page-drive below
        // is the fallback that scrollsnapchange supersedes.
        if (supportsSnapEvents) return;

        const visible = visibleSlideIndicesRef.current;
        if (visible.size === 0) return;
        const firstVisible = Math.min(...visible);
        const targetPage = pageForSlideIndex(firstVisible);
        // Guard: if a programmatic scroll is in flight (e.g. user clicked
        // NextTrigger and the smooth-scroll animation hasn't settled), the
        // IO may still see the old slide as ≥ the cutoff visible. Calling
        // goTo here would undo the navigation, so skip until the flag clears.
        if (targetPage !== currentPage && !isProgrammaticScrollRef.current) {
          isUserScrollRef.current = true;
          goTo(targetPage);
        }
      },
      { threshold: inViewThreshold },
    );

    for (const key of slideKeys) {
      // A slide can unmount in the same commit that re-runs this effect — a
      // dynamic slide-count drop removes its element from slidesRef during the
      // mutation phase while this effect still closes over the pre-drop
      // slideKeys. Skip the orphaned key; the registerSlide that unmounted it
      // schedules a fresh slideKeys, re-running this effect to observe the
      // settled set.
      const element = slidesRef.current!.get(key);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [
    transition,
    slideKeys,
    slidesRef,
    pageForSlideIndex,
    currentPage,
    goTo,
    setSlideInView,
    visibleSlideIndicesRef,
    inViewThreshold,
    inViewCutoff,
  ]);

  // Keyboard navigation per the WAI-ARIA Carousel pattern: arrow keys
  // route through the same imperative API as the trigger buttons so the
  // smooth scroll and loop-wrap animation match the click path. The
  // event.target === currentTarget guard restricts handling to the
  // Viewport itself — focus inside a slide (e.g. on a link or form
  // control) keeps its native arrow-key semantics.
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Restrict to keypresses originating on the Viewport itself —
      // focus inside a slide (e.g. on a link or form control) keeps
      // its native arrow-key semantics.
      if (event.target !== event.currentTarget) return;
      // The paging arrows follow the scroll axis: Down/Up for a vertical
      // carousel, Right/Left otherwise. Home/End are axis-agnostic.
      const forwardKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      const backwardKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      if (event.key === forwardKey) {
        event.preventDefault();
        if (canGoNext) {
          next();
        } else {
          onOverscrollStatusChange?.({
            type: "overscroll",
            edge: "end",
            source: "keyboard",
            amount: 0,
            page: currentPage,
          });
        }
      } else if (event.key === backwardKey) {
        event.preventDefault();
        if (canGoPrevious) {
          previous();
        } else {
          onOverscrollStatusChange?.({
            type: "overscroll",
            edge: "start",
            source: "keyboard",
            amount: 0,
            page: currentPage,
          });
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(totalPages - 1);
      }
    },
    [
      orientation,
      canGoNext,
      canGoPrevious,
      next,
      previous,
      goTo,
      totalPages,
      currentPage,
      onOverscrollStatusChange,
    ],
  );

  return {
    viewportRef,
    onKeyDown,
    onDragStart,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  };
}
