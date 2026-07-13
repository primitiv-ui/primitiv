import {
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
const DRAG_THRESHOLD_PX = 4;

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
    allowMouseDrag,
    refreshTick,
    visibleSlideIndicesRef,
    setSlideInView,
    isProgrammaticScrollRef,
  } = useCarouselContext();
  const internalRef = useRef<HTMLDivElement>(null);
  // Set to true by the scrollsnapchange handler and the IntersectionObserver
  // callback before they call goTo(), so the scroll effect knows the page
  // change originated from a user scroll (CSS snap already positioned the
  // viewport) and must not call scrollTo() again.
  const isUserScrollRef = useRef(false);

  // Callback ref so the consumer can compose their own ref with ours
  // via `composeRefs` later (cycle 22 introduces asChild). For now,
  // it just stashes the node.
  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    internalRef.current = node;
  }, []);

  // Mouse click-and-drag scrolling. Opt-in via `allowMouseDrag` (default
  // false) — an unconditionally-on drag could conflict with a consumer's own
  // drag-sensitive slide content (a nested carousel, a draggable card, a
  // canvas). When enabled, tracks the pointer 1:1 (no momentum) by writing
  // scrollLeft/scrollTop directly during the drag; release lets the
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
      };
    },
    [allowMouseDrag, orientation, transition],
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
      }

      event.preventDefault();
      const nextScroll = drag.startScroll - delta;
      if (vertical) viewport.scrollTop = nextScroll;
      else viewport.scrollLeft = nextScroll;
    },
    [orientation],
  );

  const endDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.dragging) {
      internalRef.current?.releasePointerCapture?.(drag.pointerId);
      internalRef.current?.removeAttribute("data-dragging");
    }
    dragStateRef.current = null;
  }, []);

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
    // the slide's leading edge to the viewport's; `center` centres it.
    const targetEl = slidesRef.current!.get(firstSlideKey)!;
    const vertical = orientation === "vertical";
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const currentScroll = vertical ? viewport.scrollTop : viewport.scrollLeft;
    const delta = vertical
      ? targetRect.top - viewportRect.top
      : targetRect.left - viewportRect.left;
    const centerOffset =
      snapAlign === "center"
        ? (vertical
            ? viewport.clientHeight - targetRect.height
            : viewport.clientWidth - targetRect.width) / 2
        : 0;
    const position = currentScroll + delta - centerOffset;
    viewport.scrollTo(
      vertical
        ? { top: position, behavior: scrollBehavior }
        : { left: position, behavior: scrollBehavior },
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
    currentPageOffset,
    slideKeys,
    slidesRef,
    refreshTick,
    scrollBehavior,
  ]);

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
      event.preventDefault();
      viewport.scrollLeft += deltaY;
    };

    viewport.addEventListener("wheel", handler, { passive: false });
    return () => viewport.removeEventListener("wheel", handler);
  }, [transition, orientation]);

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
      const slideIndex = slideKeys.findIndex(
        (key) => slidesRef.current!.get(key) === target,
      );
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

  // IntersectionObserver fallback for browsers without scrollsnapchange,
  // and the source of truth for isInView() on the imperative API. The
  // observer fires whenever a slide crosses the 0.6 visibility
  // threshold; the lowest-index visible slide derives the active page.
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
            entry.isIntersecting && entry.intersectionRatio >= 0.6,
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
        // IO may still see the old slide as ≥0.6 visible. Calling goTo
        // here would undo the navigation, so skip until the flag clears.
        if (targetPage !== currentPage && !isProgrammaticScrollRef.current) {
          isUserScrollRef.current = true;
          goTo(targetPage);
        }
      },
      { threshold: 0.6 },
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
        if (canGoNext) next();
      } else if (event.key === backwardKey) {
        event.preventDefault();
        if (canGoPrevious) previous();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(totalPages - 1);
      }
    },
    [orientation, canGoNext, canGoPrevious, next, previous, goTo, totalPages],
  );

  return {
    viewportRef,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  };
}
