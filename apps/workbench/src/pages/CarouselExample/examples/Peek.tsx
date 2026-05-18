import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_peek.scss";

/**
 * Single image centred in the viewport with a sliver of the
 * previous and next slides visible to either side, scroll-driven
 * slide transition, seamless loop. The Ark UI "spacing" recipe —
 * achieved with `padding-inline` on the viewport, `flex-basis`
 * less than 100% on the slide, and `scroll-snap-align: center`.
 *
 * JS owns: `snapAlign="center"` so programmatic navigation lands
 *   on the centred offset (`(viewportWidth - slideWidth) / 2`)
 *   instead of the start edge — this matches where the browser's
 *   snap engine settles, so there's no double-correction after a
 *   `goTo`.
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
      className="peek"
      ariaLabel="Metal primitives — peek of next slide"
      loop
      snapAlign="center"
    >
      <Carousel.Viewport className="peek__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide key={src} className="peek__slide">
            <img className="peek__image" src={src} alt={description} />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="peek__controls">
        <Carousel.PreviousTrigger
          className="peek__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="peek__indicator-group"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="peek__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
