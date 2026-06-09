import { Carousel } from "@primitiv-ui/react";

import { carouselImages } from "../fixtures";
import "./multiSlideCrossfade.css";

/**
 * Three slides visible per page, CSS-only crossfade between pages,
 * full-page step.
 *
 * JS owns: `slidesPerPage={3}`, `transition="none"` (no scroll
 *   wiring — just `data-state` flipping on the slides in the active
 *   page).
 * CSS owns: viewport `display: grid; grid-template-columns:
 *   repeat(3, 1fr)` so the seven slides stack into three columns
 *   by `:nth-child(3n+k)`; per-slide `opacity` keyed on
 *   `[data-state="active"]` with a `transition: opacity` honouring
 *   `prefers-reduced-motion`. Each cell carries the image
 *   `aspect-ratio` so the grid row keeps a stable height across the
 *   partial last page (one image, columns 2 & 3 empty).
 */
export function MultiSlideCrossfade() {
  return (
    <Carousel.Root
      className="multi-slide-crossfade cx-frame"
      ariaLabel="Metal primitives — three per page, crossfade"
      slidesPerPage={3}
      transition="none"
    >
      <Carousel.Viewport className="multi-slide-crossfade__viewport cx-viewport-track">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-slide-crossfade__slide cx-slide-surface"
          >
            <img
              className="multi-slide-crossfade__image cx-image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-slide-crossfade__controls cx-controls">
        <Carousel.PreviousTrigger
          className="multi-slide-crossfade__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-slide-crossfade__indicator-group cx-indicators"
          label="Choose page"
        />
        <Carousel.NextTrigger
          className="multi-slide-crossfade__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
