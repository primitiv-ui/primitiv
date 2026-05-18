import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_multiStepSlideScroll.scss";

/**
 * Three slides visible per page, single-slide step, scroll-driven
 * slide transition, seamless loop.
 *
 * JS owns: `slidesPerPage={3}`, `slidesPerMove={1}` (window
 *   advances one slide at a time — `floor((7 - 3) / 1) + 1 = 5`
 *   total pages, full window in every page), `loop`, default
 *   `transition="slide"`. Loop wrap clones leading/trailing
 *   `slidesPerPage` slides on each side.
 * CSS owns: same as the full-page-step variant — viewport `gap`
 *   and slide `flex: 0 0 calc((100% - 2 * var(--gap)) / 3)`.
 */
export function MultiStepSlideScroll() {
  return (
    <Carousel.Root
      className="multi-step-slide-scroll"
      ariaLabel="Metal primitives — three per page, step one"
      slidesPerPage={3}
      slidesPerMove={1}
      loop
    >
      <Carousel.Viewport className="multi-step-slide-scroll__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-step-slide-scroll__slide"
          >
            <img
              className="multi-step-slide-scroll__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-step-slide-scroll__controls">
        <Carousel.PreviousTrigger
          className="multi-step-slide-scroll__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-step-slide-scroll__indicator-group"
          label="Choose window"
        />
        <Carousel.NextTrigger
          className="multi-step-slide-scroll__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
