import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./singleSlideCrossfade.css";

/**
 * Single image visible at a time, CSS-only crossfade between slides.
 *
 * JS owns: `transition="none"` (skips all scroll wiring; the visual is
 *   purely a `data-state` flip on the active slide).
 * CSS owns: viewport `position: relative` + fixed aspect ratio so
 *   absolutely-positioned slides stack; per-slide `opacity` keyed on
 *   `[data-state="active"]` with a `transition: opacity` honouring
 *   `prefers-reduced-motion`.
 */
export function SingleSlideCrossfade() {
  return (
    <Carousel.Root
      className="single-slide-crossfade cx-frame"
      ariaLabel="Metal primitives — crossfade"
      transition="none"
    >
      <Carousel.Viewport className="single-slide-crossfade__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="single-slide-crossfade__slide"
          >
            <img
              className="single-slide-crossfade__image cx-image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="single-slide-crossfade__controls cx-controls">
        <Carousel.PreviousTrigger
          className="single-slide-crossfade__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="single-slide-crossfade__indicator-group cx-indicators"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="single-slide-crossfade__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
