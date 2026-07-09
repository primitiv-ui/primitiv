import { useCallback, useId } from "react";

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
 */
export function useCarouselSlide() {
  const { registerSlide, slideKeys, slidesPerPage, currentPageOffset } =
    useCarouselContext();
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

  return { slideRef, index, total, state };
}
