import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./singleSlideScroll.css";

/**
 * Single image visible at a time, scroll-driven slide transition.
 *
 * JS owns: default `transition="slide"` (browser-native scroll-snap
 *   drives the visual; programmatic navigation delegates to
 *   `scrollIntoView`).
 * CSS owns: viewport flex + `scroll-snap-type: x mandatory`,
 *   slide `flex: 0 0 100%` + `scroll-snap-align: start`.
 */
export function SingleSlideScroll() {
  return (
    <Carousel.Root
      className="single-slide-scroll cx-frame"
      ariaLabel="Metal primitives — single slide"
    >
      <Carousel.Viewport className="single-slide-scroll__viewport cx-viewport-track">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="single-slide-scroll__slide cx-slide-surface"
          >
            <img
              className="single-slide-scroll__image cx-image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="single-slide-scroll__controls cx-controls">
        <Carousel.PreviousTrigger
          className="single-slide-scroll__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="single-slide-scroll__indicator-group cx-indicators"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="single-slide-scroll__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
