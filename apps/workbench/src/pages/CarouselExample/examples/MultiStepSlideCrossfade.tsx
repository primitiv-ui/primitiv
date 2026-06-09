import { Carousel } from "@primitiv-ui/react";

import { carouselImages } from "../fixtures";
import "./multiStepSlideCrossfade.css";

/**
 * Three slides visible per page, single-slide step, CSS-only
 * crossfade between pages.
 *
 * JS owns: `slidesPerPage={3}`, `slidesPerMove={1}` (5 total
 *   pages — `floor((7 - 3) / 1) + 1`), `transition="none"`. The
 *   page diff between adjacent pages is exactly one slide, so each
 *   step swaps one column visually.
 * CSS owns: same three-column grid as `MultiSlideCrossfade`.
 *   Slide `i` lives permanently in column `(i mod 3) + 1`, so the
 *   slide that leaves and the slide that enters always share a
 *   column — the crossfade happens in one cell at a time, not as
 *   a sliding window.
 */
export function MultiStepSlideCrossfade() {
  return (
    <Carousel.Root
      className="multi-step-slide-crossfade cx-frame"
      ariaLabel="Metal primitives — three per page, step one, crossfade"
      slidesPerPage={3}
      slidesPerMove={1}
      transition="none"
    >
      <Carousel.Viewport className="multi-step-slide-crossfade__viewport cx-viewport-track">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-step-slide-crossfade__slide cx-slide-surface"
          >
            <img
              className="multi-step-slide-crossfade__image cx-image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-step-slide-crossfade__controls cx-controls">
        <Carousel.PreviousTrigger
          className="multi-step-slide-crossfade__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-step-slide-crossfade__indicator-group cx-indicators"
          label="Choose window"
        />
        <Carousel.NextTrigger
          className="multi-step-slide-crossfade__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
