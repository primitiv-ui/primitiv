import { KeyboardEvent, useCallback, useEffect, useMemo, useRef } from "react";

import { useCarouselContext } from "./useCarouselContext";

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
 * isn't one of our registered slides).
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
    effectiveSlidesPerMove,
    totalPages,
    currentPage,
    goTo,
    next,
    previous,
    canGoNext,
    canGoPrevious,
    transition,
    snapAlign,
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
    const firstSlideIndex = currentPage * effectiveSlidesPerMove;
    const firstSlideKey = slideKeys[firstSlideIndex];
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

    // Native-first: delegate the horizontal scroll to the browser via
    // scrollIntoView rather than computing scrollLeft ourselves. The
    // consumer's `scroll-snap-align` then makes the final correction so
    // we never fight the snap engine. `inline` maps to snapAlign;
    // `block: "nearest"` keeps the page from scrolling vertically.
    const targetEl = slidesRef.current!.get(firstSlideKey)!;
    targetEl.scrollIntoView({
      behavior: scrollBehavior,
      inline: snapAlign === "center" ? "center" : "start",
      block: "nearest",
    });

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
    currentPage,
    effectiveSlidesPerMove,
    slideKeys,
    slidesRef,
    refreshTick,
    scrollBehavior,
  ]);

  // User-driven scroll → state. Listen for scrollsnapchange and update
  // currentPage from the snapped slide's index. The viewport ref is
  // guaranteed populated post-commit (callback ref runs first).
  useEffect(() => {
    if (transition !== "slide") return;
    const viewport = internalRef.current!;

    const handler = (event: Event) => {
      const target = (event as Event & { snapTargetInline?: Element })
        .snapTargetInline;

      // findIndex returns -1 when the snap target isn't one of our
      // registered slides — e.g. a consumer-wrapped element inside the
      // viewport. Ignore those; only registered slides drive the page.
      const slideIndex = slideKeys.findIndex(
        (key) => slidesRef.current!.get(key) === target,
      );
      if (slideIndex < 0) return;

      const targetPage = Math.floor(slideIndex / effectiveSlidesPerMove);
      if (targetPage !== currentPage) {
        isUserScrollRef.current = true;
        goTo(targetPage);
      }
    };

    viewport.addEventListener("scrollsnapchange", handler);
    return () => viewport.removeEventListener("scrollsnapchange", handler);
  }, [
    transition,
    slideKeys,
    slidesRef,
    effectiveSlidesPerMove,
    currentPage,
    goTo,
  ]);

  // IntersectionObserver fallback for browsers without scrollsnapchange,
  // and the source of truth for isInView() on the imperative API. The
  // observer fires whenever a slide crosses the 0.6 visibility
  // threshold; the lowest-index visible slide derives the active page.
  useEffect(() => {
    if (transition !== "slide") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Both lookups (slideKeys.findIndex → registered key, and the
        // slidesRef get → element) are guaranteed to resolve: the
        // observer only observes elements registered into slidesRef
        // alongside their slideKey, and is disconnected on cleanup
        // before slides can unmount.
        for (const entry of entries) {
          const idx = slideKeys.findIndex(
            (key) => slidesRef.current!.get(key) === entry.target,
          );
          setSlideInView(
            idx,
            entry.isIntersecting && entry.intersectionRatio >= 0.6,
          );
        }

        const visible = visibleSlideIndicesRef.current;
        if (visible.size === 0) return;
        const firstVisible = Math.min(...visible);
        const targetPage = Math.floor(firstVisible / effectiveSlidesPerMove);
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
      observer.observe(slidesRef.current!.get(key)!);
    }

    return () => observer.disconnect();
  }, [
    transition,
    slideKeys,
    slidesRef,
    effectiveSlidesPerMove,
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
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (canGoNext) next();
      } else if (event.key === "ArrowLeft") {
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
    [canGoNext, canGoPrevious, next, previous, goTo, totalPages],
  );

  return { viewportRef, onKeyDown };
}
