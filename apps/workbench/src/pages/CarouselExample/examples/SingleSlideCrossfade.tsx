import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_singleSlideCrossfade.scss";

/**
 * Single image visible at a time, CSS-only crossfade between slides,
 * seamless loop.
 *
 * JS owns: `transition="none"` (skips all scroll wiring; no clones
 *   are injected at the loop boundary because there's no scroll axis
 *   to wrap on), `loop` (just flips `data-state` on the active slide
 *   when wrapping page 6 → page 0).
 * CSS owns: viewport `position: relative` + fixed aspect ratio so
 *   absolutely-positioned slides stack; per-slide `opacity` keyed on
 *   `[data-state="active"]` with a `transition: opacity` honouring
 *   `prefers-reduced-motion`.
 */
export function SingleSlideCrossfade() {
  return (
    <Carousel.Root
      className="single-slide-crossfade"
      ariaLabel="Metal primitives — crossfade"
      loop
      transition="none"
    >
      <Carousel.Viewport className="single-slide-crossfade__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="single-slide-crossfade__slide"
          >
            <img
              className="single-slide-crossfade__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="single-slide-crossfade__controls">
        <Carousel.PreviousTrigger
          className="single-slide-crossfade__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="single-slide-crossfade__indicator-group"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="single-slide-crossfade__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
