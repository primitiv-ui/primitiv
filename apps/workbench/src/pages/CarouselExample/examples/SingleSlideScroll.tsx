import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_singleSlideScroll.scss";

/**
 * Single image visible at a time, scroll-driven slide transition,
 * seamless loop.
 *
 * JS owns: `loop`, default `transition="slide"` (browser-native
 *   scroll-snap drives the visual; clones inject at edges so the
 *   wrap is seamless).
 * CSS owns: viewport flex + `scroll-snap-type: x mandatory`,
 *   slide `flex: 0 0 100%` + `scroll-snap-align: start`.
 */
export function SingleSlideScroll() {
  return (
    <Carousel.Root
      className="single-slide-scroll"
      ariaLabel="Metal primitives — single slide"
      loop
    >
      <Carousel.Viewport className="single-slide-scroll__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="single-slide-scroll__slide"
          >
            <img
              className="single-slide-scroll__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="single-slide-scroll__controls">
        <Carousel.PreviousTrigger
          className="single-slide-scroll__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="single-slide-scroll__indicator-group"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="single-slide-scroll__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
