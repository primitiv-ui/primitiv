import { Carousel } from "@primitiv-ui/react";

import { carouselImages } from "../fixtures";
import "./peek.css";

/**
 * Single image centred in the viewport with a sliver of the
 * previous and next slides visible to either side, scroll-driven
 * slide transition. The Ark UI "spacing" recipe — achieved with
 * `padding-inline` on the viewport, `flex-basis` less than 100% on
 * the slide, and `scroll-snap-align: center`.
 *
 * JS owns: `snapAlign="center"` so programmatic navigation passes
 *   `inline: "center"` to `scrollIntoView` — the browser's
 *   `scroll-snap-align: center` then makes the final correction, so
 *   there's no double-correction after a `goTo`.
 * CSS owns: viewport `padding-inline` (the symmetric peek
 *   distance), viewport `scroll-padding-inline` (so the snap
 *   target accounts for the padding), slide
 *   `flex: 0 0 var(--slide-width)`, slide
 *   `scroll-snap-align: center`. The `gap` between slides is
 *   independent and lives entirely in CSS.
 */
export function Peek() {
  return (
    <Carousel.Root
      className="peek cx-frame"
      ariaLabel="Metal primitives — peek of next slide"
      snapAlign="center"
    >
      <Carousel.Viewport className="peek__viewport cx-viewport-track">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide key={src} className="peek__slide cx-slide-surface">
            <img className="peek__image cx-image" src={src} alt={description} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="peek__controls cx-controls">
        <Carousel.PreviousTrigger
          className="peek__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="peek__indicator-group cx-indicators"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="peek__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
