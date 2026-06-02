import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_coverFlow.scss";

/**
 * Cover Flow — based on the Blossom carousel CSS technique.
 *
 * Each Carousel.Slide is a narrow snap unit (130px). Inside it sits a
 * 200%-wide absolutely-positioned `__visual` div (the perspective + translateX
 * container) that overflows the snap unit on each side, and inside that a
 * `__card` div that handles only the rotateY. Both elements are driven by
 * the same named `view-timeline` defined on the snap unit — using
 * `animation-range: contain` so the animation is anchored to the centred
 * position rather than the full entry/exit journey.
 */
export function CoverFlow() {
  return (
    <Carousel.Root
      className="cover-flow"
      ariaLabel="Metal primitives — cover flow"
      snapAlign="center"
    >
      <Carousel.Viewport className="cover-flow__viewport">
        {carouselImages.map(({ src, description }) => (
          <Carousel.Slide key={src} className="cover-flow__slide">
            <div className="cover-flow__visual">
              <div className="cover-flow__card">
                <img
                  className="cover-flow__image"
                  src={src}
                  alt={description}
                />
              </div>
            </div>
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="cover-flow__controls">
        <Carousel.PreviousTrigger
          className="cover-flow__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="cover-flow__indicator-group"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="cover-flow__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
