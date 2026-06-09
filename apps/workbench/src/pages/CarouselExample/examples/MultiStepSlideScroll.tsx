import { Carousel } from "@primitiv-ui/react";

import { carouselImages } from "../fixtures";
import "./multiStepSlideScroll.css";

/**
 * Three slides visible per page, single-slide step, scroll-driven
 * slide transition.
 *
 * JS owns: `slidesPerPage={3}`, `slidesPerMove={1}` (window
 *   advances one slide at a time — `floor((7 - 3) / 1) + 1 = 5`
 *   total pages, full window in every page), default
 *   `transition="slide"`.
 * CSS owns: same as the full-page-step variant — viewport `gap`
 *   and slide `flex: 0 0 calc((100% - 2 * var(--gap)) / 3)`.
 */
export function MultiStepSlideScroll() {
  return (
    <Carousel.Root
      className="multi-step-slide-scroll cx-frame"
      ariaLabel="Metal primitives — three per page, step one"
      slidesPerPage={3}
      slidesPerMove={1}
    >
      <Carousel.Viewport className="multi-step-slide-scroll__viewport cx-viewport-track">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide
            key={src}
            className="multi-step-slide-scroll__slide cx-slide-surface"
          >
            <img
              className="multi-step-slide-scroll__image cx-image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="multi-step-slide-scroll__controls cx-controls">
        <Carousel.PreviousTrigger
          className="multi-step-slide-scroll__trigger cx-trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="multi-step-slide-scroll__indicator-group cx-indicators"
          label="Choose window"
        />
        <Carousel.NextTrigger
          className="multi-step-slide-scroll__trigger cx-trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
