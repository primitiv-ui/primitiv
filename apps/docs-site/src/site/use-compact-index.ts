"use client";

import { useSyncExternalStore } from "react";

/**
 * True once the viewport is too narrow for the components grid to hold two
 * columns — the point at which the index needs a different shape rather than
 * the same one stacked.
 *
 * ## Why a hook rather than CSS
 *
 * Two of the three changes at this breakpoint are structural, not cosmetic. The
 * cards switch to Card's own `horizontal` layout, and the ten category sections
 * become an Accordion. Neither is a property CSS can flip: the first is a class
 * modifier the component owns, and the second is a different element tree with
 * its own ARIA wiring. Faking either from a media query would mean reaching
 * into another component's internals and lying about the accessibility state.
 *
 * ## What this costs
 *
 * The server cannot know the viewport, so it renders the WIDE shape. That is
 * the deliberate choice: it is also the correct no-JavaScript fallback — every
 * card visible, nothing hidden behind a control that will never respond. A
 * phone therefore reflows once on first load as the accordion collapses. The
 * alternative, rendering collapsed and expanding on desktop, trades that reflow
 * for a page that shows nothing at all without JavaScript.
 *
 * `36rem` is where `--docs-index-card-min` (16rem) stops fitting twice with a
 * grid gap between; below it the grid is single-column regardless, which is
 * what makes the vertical card such a poor use of the space.
 */
const QUERY = "(max-width: 36rem)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export const useCompactIndex = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    /* Server snapshot: the wide shape, which is the no-JS fallback too. */
    () => false,
  );
