import { useCallback, useId } from "react";

import type { CarouselSnapAlign } from "../types";
import { useCarouselContext } from "./useCarouselContext";

/**
 * Per-slide hook: self-registers with the Root so the Root can compute
 * the live slide count, and exposes the slide's zero-based `index` plus
 * the current `total`.
 *
 * The returned `slideRef` is a callback ref — attached to the rendered
 * slide element so registration runs synchronously during commit. Using
 * a callback ref (rather than `useEffect`) keeps DOM-attachment and
 * registration in lockstep, which matters when slides mount or unmount
 * during a render pass driven by an external state change.
 *
 * `snapAlignOverride` is the slide's own `Carousel.Slide.snapAlign` prop
 * (if set) — it wins over the root's resolved `snapAlign` for this one
 * slide, but only when the slide is actually a valid snap-start position;
 * see the `snapAlign` field below.
 */
export function useCarouselSlide(snapAlignOverride?: CarouselSnapAlign) {
  const {
    registerSlide,
    slideKeys,
    slidesPerPage,
    currentPageOffset,
    effectiveSlidesPerMove,
    snapAlign: rootSnapAlign,
  } = useCarouselContext();
  const slideKey = useId();

  const slideRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerSlide(slideKey, element);
    },
    [registerSlide, slideKey],
  );

  const index = slideKeys.indexOf(slideKey);
  const total = slideKeys.length;
  // The active page covers a window of slidesPerPage slides starting at
  // currentPageOffset (computed by the Root — non-overlapping page groups
  // in "auto" mode, overlapping/end-aligned windows with a numeric
  // slidesPerMove).
  const isActive =
    index >= 0 &&
    index >= currentPageOffset &&
    index < currentPageOffset + slidesPerPage;
  const state: "active" | "inactive" = isActive ? "active" : "inactive";

  // Only a page's *leading* slide is a valid scroll-snap resting position.
  // The Root's page offsets are `min(page * effectiveSlidesPerMove,
  // maxOffset)` for each page — the same set an interior slide (any other
  // index) is never a member of. Letting every slide snap (the old,
  // unconditional CSS default) lets the browser rest scroll on an interior
  // slide when slidesPerPage > 1, which has no valid page mapping: the
  // viewport shows a straddled mix of two pages while currentPage/the
  // indicators still claim one clean page is active. Mirrors the identical
  // offset formula pageForSlideIndex inverts, so the two always agree.
  const maxOffset = Math.max(0, total - slidesPerPage);
  const isSnapStart =
    index >= 0 &&
    (index === maxOffset ||
      (index <= maxOffset && index % effectiveSlidesPerMove === 0));
  // The *value* mirrors the resolved root snapAlign (or this slide's own
  // override, if set), not just a fixed "start" — so the native scroll-snap
  // resting position agrees with where the programmatic scroll (Viewport's
  // centerOffset maths, which reads this same value off the DOM) actually
  // targets. Previously this was hardcoded to "start" regardless of
  // snapAlign, so a user's own swipe/wheel/drag would snap back to the
  // slide's leading edge even under snapAlign="center". Gated on
  // isSnapStart either way — an interior slide of a multi-slide page must
  // never snap, even if it carries its own snapAlign override.
  const snapAlign = isSnapStart
    ? (snapAlignOverride ?? rootSnapAlign)
    : undefined;

  return { slideRef, index, total, state, snapAlign };
}
