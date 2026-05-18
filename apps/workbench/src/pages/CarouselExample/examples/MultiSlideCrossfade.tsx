import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_multiSlideCrossfade.scss";

/**
 * Three slides visible per page, CSS-only crossfade between pages,
 * full-page step, seamless loop.
 *
 * JS owns: `slidesPerPage={3}`, `transition="none"` (no scroll
 *   wiring, no edge clones — just `data-state` flipping on the
 *   slides in the active page), `loop` (modular page wrapping).
 * CSS owns: viewport `display: grid; grid-template-columns:
 *   repeat(3, 1fr)` so the seven slides stack into three columns
 *   by `:nth-child(3n+k)`; per-slide `opacity` keyed on
 *   `[data-state="active"]` with a `transition: opacity` honouring
 *   `prefers-reduced-motion`. The partial last page (one image,
 *   columns 2 & 3 empty) is left as-is — the headless contract
 *   means layout fixes for partial pages are a consumer concern.
 */
export function MultiSlideCrossfade() {
  return (
    <Carousel.Root
      className="multi-slide-crossfade"
      ariaLabel="Metal primitives — three per page, crossfade"
      slidesPerPage={3}
      transition="none"
      loop
    >
      <Carousel.Viewport className="multi-slide-crossfade__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-slide-crossfade__slide"
          >
            <img
              className="multi-slide-crossfade__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-slide-crossfade__controls">
        <Carousel.PreviousTrigger
          className="multi-slide-crossfade__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-slide-crossfade__indicator-group"
          label="Choose page"
        />
        <Carousel.NextTrigger
          className="multi-slide-crossfade__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
