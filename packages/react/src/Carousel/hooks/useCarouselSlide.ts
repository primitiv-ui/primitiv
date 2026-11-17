import { useCallback, useId } from "react";

import { carouselSlideActive, carouselSnapStart } from "@primitiv-ui/core";

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
    effectiveSlidesPerMove,
    maxOffset,
    totalPages,
    currentPage,
    snapAlign: rootSnapAlign,
  } = useCarouselContext();
  const slideKey = useId();

  const slideRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerSlide(slideKey, element);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependencies (a stable callback and this slide's own id).
    [registerSlide, slideKey],
  );

  const index = slideKeys.indexOf(slideKey);
  const total = slideKeys.length;
  // The Root's page layout, which core reads both questions from — the same
  // policy the `<primitiv-carousel>` elements use (RFC 0033).
  const layout = {
    total,
    perPage: slidesPerPage,
    move: effectiveSlidesPerMove,
    maxOffset,
    totalPages,
  };
  // The active page covers a window of slidesPerPage slides starting at its
  // offset: non-overlapping groups in "auto" mode, overlapping and
  // end-aligned windows with a numeric slidesPerMove. An unregistered slide
  // (index -1) is never in it.
  const state: "active" | "inactive" = carouselSlideActive(layout, currentPage, index)
    ? "active"
    : "inactive";

  // Only a page's *leading* slide is a valid scroll-snap resting position:
  // letting an interior slide of a multi-slide page snap rests the viewport on
  // a straddled mix of two pages while the indicators claim one. The *value*
  // is this slide's own override or the root's snapAlign, so the native
  // resting position agrees with where the programmatic scroll aims.
  const snapAlign = carouselSnapStart(layout, index)
    ? (snapAlignOverride ?? rootSnapAlign)
    : undefined;

  return { slideRef, index, total, state, snapAlign };
}
