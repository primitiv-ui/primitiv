import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_multiStepSlideCrossfade.scss";

/**
 * Three slides visible per page, single-slide step, CSS-only
 * crossfade between pages, seamless loop.
 *
 * JS owns: `slidesPerPage={3}`, `slidesPerMove={1}` (5 total
 *   pages — `floor((7 - 3) / 1) + 1`), `transition="none"`,
 *   `loop`. The page diff between adjacent pages is exactly one
 *   slide, so each step swaps one column visually.
 * CSS owns: same three-column grid as `MultiSlideCrossfade`.
 *   Slide `i` lives permanently in column `(i mod 3) + 1`, so the
 *   slide that leaves and the slide that enters always share a
 *   column — the crossfade happens in one cell at a time, not as
 *   a sliding window.
 */
export function MultiStepSlideCrossfade() {
  return (
    <Carousel.Root
      className="multi-step-slide-crossfade"
      ariaLabel="Metal primitives — three per page, step one, crossfade"
      slidesPerPage={3}
      slidesPerMove={1}
      transition="none"
      loop
    >
      <Carousel.Viewport className="multi-step-slide-crossfade__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-step-slide-crossfade__slide"
          >
            <img
              className="multi-step-slide-crossfade__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-step-slide-crossfade__controls">
        <Carousel.PreviousTrigger
          className="multi-step-slide-crossfade__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-step-slide-crossfade__indicator-group"
          label="Choose window"
        />
        <Carousel.NextTrigger
          className="multi-step-slide-crossfade__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
