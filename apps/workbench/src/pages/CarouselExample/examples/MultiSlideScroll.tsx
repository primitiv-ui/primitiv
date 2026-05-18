import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_multiSlideScroll.scss";

/**
 * Three slides visible per page, scroll-driven slide transition,
 * full-page step (default `slidesPerMove="auto"`), seamless loop.
 *
 * JS owns: `slidesPerPage={3}` (drives the page math —
 *   `ceil(7 / 3) = 3` total pages, last page partial), `loop`
 *   (clones leading/trailing windows for seamless wrap), default
 *   `transition="slide"`.
 * CSS owns: viewport `gap` for inter-slide spacing, slide
 *   `flex: 0 0 calc((100% - 2 * var(--gap)) / 3)` so the three
 *   visible slides plus two gaps fill the viewport exactly.
 */
export function MultiSlideScroll() {
  return (
    <Carousel.Root
      className="multi-slide-scroll"
      ariaLabel="Metal primitives — three per page"
      slidesPerPage={3}
      loop
    >
      <Carousel.Viewport className="multi-slide-scroll__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-slide-scroll__slide"
          >
            <img
              className="multi-slide-scroll__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-slide-scroll__controls">
        <Carousel.PreviousTrigger
          className="multi-slide-scroll__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-slide-scroll__indicator-group"
          label="Choose page"
        />
        <Carousel.NextTrigger
          className="multi-slide-scroll__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
